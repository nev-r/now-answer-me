import { MessageActionRow, MessageButton, MessageSelectMenu, } from "discord.js";
import { escMarkdown } from "one-stone/string";
import { sendableToInteractionReplyOptions } from "../utils/misc.js";
import { arrayify } from "one-stone/array";
export const interactionIdSeparator = "␞";
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
                customId: interactionID + interactionIdSeparator + value,
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
        const customId = interactionID + interactionIdSeparator + controlID;
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
    let [interactionID, controlID] = interaction.customId.split(interactionIdSeparator);
    const handlingData = componentInteractions[interactionID];
    if (!handlingData)
        unhandledInteraction(interaction);
    else {
        let { handler, ephemeral, deferImmediately, deferIfLong, update } = handlingData;
        let deferalCountdown;
        if (deferImmediately || deferIfLong) {
            deferalCountdown = setTimeout(() => (update ? interaction.deferUpdate() : interaction.deferReply({ ephemeral })), deferImmediately ? 0 : 2300);
        }
        try {
            let results;
            if (typeof handler === "function") {
                const { guild, channel, user } = interaction;
                const values = interaction.isSelectMenu() ? interaction.values : undefined;
                results =
                    (await handler({
                        channel,
                        guild,
                        user,
                        interactionID,
                        controlID,
                        values,
                    })) || "";
            }
            else {
                results = handler;
            }
            deferalCountdown && clearTimeout(deferalCountdown);
            if (results && !update && !interaction.replied) {
                await interaction.reply({ ephemeral, ...sendableToInteractionReplyOptions(results) });
            }
            if (results && update) {
                await interaction.update(sendableToInteractionReplyOptions(results));
            }
        }
        catch (e) {
            await interaction.reply({ content: "⚠", ephemeral: true });
            console.log(e);
        }
    }
}
function unhandledInteraction(interaction) {
    let content = `unhandled component interaction 🙂\nid: \`${escMarkdown(interaction.customId)}\``;
    if (interaction.isSelectMenu()) {
        const values = interaction.values.map((v) => `\`${escMarkdown(v)}\``).join(" ");
        content += `\nvalues submitted: ${values}`;
    }
    interaction.reply({
        ephemeral: true,
        content,
    });
}
