import { MessageActionRow, MessageButton, MessageSelectMenu, } from "discord.js";
import { escMarkdown } from "one-stone/string";
import { sendableToInteractionReplyOptions } from "../utils/misc.js";
import { arrayify } from "one-stone/array";
import { deserialize, serialize } from "./component-id-parser.js";
import { forceFeedback, replyOrEdit, updateComponent } from "../utils/raw-utils.js";
import { client } from "./index.js";
export const wastebasket = String.fromCodePoint(0x1f5d1); // 🗑
export const lock = String.fromCodePoint(0x1f512); // 🔒
export const componentInteractions = {};
export function createComponentButtons({ interactionID, buttons, ...handlingData }) {
    componentInteractions[interactionID] = handlingData;
    const nestedButtons = Array.isArray(buttons)
        ? Array.isArray(buttons[0])
            ? buttons
            : [buttons]
        : [[buttons]];
    return nestedButtons.map((r) => new MessageActionRow({
        components: r.map((b) => {
            const { value, ...rest } = b;
            return new MessageButton({
                customId: serialize({ interactionID, operation: value }),
                ...rest,
            });
        }),
    }));
}
export function createComponentSelects({ interactionID, selects, ...handlingData }) {
    componentInteractions[interactionID] = handlingData;
    const nestedSelects = arrayify(selects);
    return nestedSelects.map((s) => {
        const { controlID, ...rest } = s;
        const customId = serialize({ interactionID, operation: controlID });
        return new MessageActionRow({
            components: [
                new MessageSelectMenu({
                    customId,
                    ...rest,
                }),
            ],
        });
    });
}
export async function routeComponentInteraction(interaction) {
    const { interactionID, ...componentParams } = deserialize(interaction.customId);
    const handlingData = componentInteractions[interactionID];
    if (!handlingData)
        unhandledInteraction(interaction);
    else {
        // if it's a private interaction, only the initiator may click its buttons
        if (!handlingData.public) {
            const originalUser = interaction.message.interaction?.user.id;
            if (originalUser && interaction.user.id !== originalUser) {
                // end it here
                interaction.followUp({ ephemeral: true, content: "this isnt your control" });
                return;
            }
        }
        let { handler, ephemeral, deferImmediately, allowTimeout, update } = handlingData;
        let deferalCountdown;
        // idk why we would want to timeout (shows an error message in discord), but..
        if (!allowTimeout) {
            // schedule a deferral. deferImmediately makes the button stop spinning right away.
            // which is probably bad UX.
            // otherwise, defer in 2.2 seconds if it looks like the function
            // might run past the 3 second response window
            const deferralDelay = deferImmediately ? 0 : 2200;
            const deferralMethod = () => update ? interaction.deferUpdate() : interaction.deferReply({ ephemeral });
            deferalCountdown = setTimeout(deferralMethod, deferralDelay);
        }
        try {
            let results;
            if (typeof handler === "function") {
                const channel = interaction.channel ??
                    (await client.channels.fetch(interaction.channelId));
                const message = await channel?.messages.fetch(interaction.message.id);
                const { guild, user } = interaction;
                // const { guild, channel, user, message } = interaction;
                const values = interaction.isSelectMenu() ? interaction.values : undefined;
                results =
                    (await handler({
                        guild,
                        channel,
                        user,
                        message,
                        interactionID,
                        componentParams,
                        values,
                    })) || "";
            }
            else {
                results = handler;
            }
            // the response function finished. we can cancel the scheduled deferral
            deferalCountdown !== undefined && clearTimeout(deferalCountdown);
            if (results) {
                if (update) {
                    await updateComponent(interaction, sendableToInteractionReplyOptions(results));
                }
                else {
                    if (!interaction.replied) {
                        await replyOrEdit(interaction, {
                            ephemeral,
                            ...sendableToInteractionReplyOptions(results),
                        });
                    }
                }
            }
        }
        catch (e) {
            deferalCountdown !== undefined && clearTimeout(deferalCountdown);
            console.log("caught error in a handler");
            console.log(e);
            await forceFeedback(interaction, { content: `⚠. ${e}`, ephemeral: true });
        }
    }
}
function unhandledInteraction(interaction) {
    let content = `unhandled component interaction 🙂\nid: \`${escMarkdown(interaction.customId)}\``;
    content += `\ndeserialized as:\n${JSON.stringify(deserialize(interaction.customId), null, 2)}`;
    content += `\nkeys available${Object.keys(componentInteractions).join(", ")}\n`;
    if (interaction.isSelectMenu()) {
        const values = interaction.values.map((v) => `\`${escMarkdown(v)}\``).join(" ");
        content += `\nvalues submitted: ${values}`;
    }
    interaction.reply({
        ephemeral: true,
        content,
    });
}
// register handler for lock functionality
// (removes components so it can receive no further interaction)
componentInteractions[lock] = {
    handler: async ({ message, channel }) => {
        if (message) {
            const returnOptions = { components: [] };
            if (message.content)
                returnOptions.content = message.content;
            if (message.embeds)
                returnOptions.embeds = message.embeds;
            return returnOptions;
        }
    },
    update: true,
};
// register handler for remove functionality
// (removes the message)
componentInteractions[wastebasket] = {
    handler: async ({ message }) => {
        await message?.delete();
    },
};
