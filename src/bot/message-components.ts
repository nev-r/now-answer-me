import {
	ActionRowBuilder,
	APISelectMenuOption,
	ButtonBuilder,
	ButtonStyle,
	Embed,
	Guild,
	InteractionReplyOptions,
	MessageComponentInteraction,
	TextBasedChannel,
	User,
} from "discord.js";
import { escMarkdown } from "one-stone/string";
import { Sendable } from "../types/types-bot.js";
import { Message } from "discord.js";
import { Awaitable } from "one-stone/types";
import {
	sendableToInteractionReplyOptions,
	sendableToInteractionUpdateOptions,
	sendableToMessageOptions,
	sendableToPayload,
} from "../utils/misc.js";
import { arrayify } from "one-stone/array";
import { ComponentParams, deserialize, serialize } from "./component-id-parser.js";
import { forceFeedback, replyOrEdit } from "../utils/raw-utils.js";
// import { updateComponent } from "../utils/raw-utils.js";
import { client } from "./index.js";
import { SelectMenuBuilder } from "@discordjs/builders";
import { APIMessageComponentEmoji } from "discord.js/node_modules/discord-api-types/v9";

export const wastebasket = String.fromCodePoint(0x1f5d1); // 🗑
export const wastebasketEmoji = { name: String.fromCodePoint(0x1f5d1) }; // 🗑
export const lock = String.fromCodePoint(0x1f512); // 🔒
export const lockEmoji = { name: String.fromCodePoint(0x1f512) }; // 🔒

export type ComponentInteractionHandlingData = {
	handler:
		| Sendable
		| ((_: {
				guild: Guild | null;
				channel: TextBasedChannel | null;
				user: User;
				message?: Message;
				interactionID: string;
				componentParams: ComponentParams;
				values?: string[];
		  }) => Awaitable<Sendable | undefined | void>);
	ephemeral?: boolean;
	deferImmediately?: boolean;
	allowTimeout?: boolean;
	/** send this reponse by updating the interacted message, instead of creating a new message */
	update?: boolean;
	public?: boolean;
};

export const componentInteractions: NodeJS.Dict<ComponentInteractionHandlingData> = {};

type InteractionButton = {
	disabled?: boolean;
	style: Exclude<ButtonStyle, "LINK" | ButtonStyle.Link>;
	value: string;
} & (
	| { emoji: APIMessageComponentEmoji; label: string }
	| { emoji?: undefined; label: string }
	| {
			emoji: APIMessageComponentEmoji;
			label?: undefined;
	  }
);

// isnt it cooler to NOT unwrap a starburst in your mouth? just eat it. wax paper and all. badass

type InteractionSelect = {
	controlID: string;
	disabled?: boolean;
	maxValues?: number;
	minValues?: number;
	options: APISelectMenuOption[];
	placeholder?: string;
};

export function createComponentButtons({
	interactionID,
	buttons,
	...handlingData
}: {
	buttons: InteractionButton | InteractionButton[] | InteractionButton[][];
	interactionID: string;
} & ComponentInteractionHandlingData) {
	componentInteractions[interactionID] = handlingData;
	const nestedButtons: InteractionButton[][] = Array.isArray(buttons)
		? Array.isArray(buttons[0])
			? (buttons as InteractionButton[][])
			: [buttons as InteractionButton[]]
		: [[buttons]];

	return nestedButtons.map((r) =>
		new ActionRowBuilder().addComponents(
			...r.map((b) => {
				const button = new ButtonBuilder();
				b.emoji && button.setEmoji(b.emoji);
				button.setDisabled(b.disabled);
				button.setStyle(b.style);
				b.label && button.setLabel(b.label);
				button.setCustomId(serialize({ interactionID, operation: b.value }));

				return button;
			})
		)
	);
}

export function createComponentSelects({
	interactionID,
	selects,
	...handlingData
}: {
	selects: InteractionSelect | InteractionSelect[];
	interactionID: string;
} & ComponentInteractionHandlingData) {
	componentInteractions[interactionID] = handlingData;
	const nestedSelects = arrayify(selects);

	return nestedSelects.map((s) => {
		const { controlID, ...rest } = s;
		const select = new SelectMenuBuilder();
		select.setCustomId(serialize({ interactionID, operation: controlID }));

		select.setDisabled(s.disabled);
		s.placeholder && select.setPlaceholder(s.placeholder);
		s.maxValues && select.setMaxValues(s.maxValues);
		s.minValues && select.setMinValues(s.minValues);
		select.setOptions(...s.options);

		return new ActionRowBuilder().addComponents(select);
	});
}

export async function routeComponentInteraction(
	interaction: MessageComponentInteraction
): Promise<void> {
	const { interactionID, ...componentParams } = deserialize(interaction.customId);
	const handlingData = componentInteractions[interactionID];
	if (!handlingData) unhandledInteraction(interaction);
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

		let deferalCountdown: undefined | NodeJS.Timeout;

		// idk why we would want to timeout (shows an error message in discord), but..
		if (!allowTimeout) {
			// schedule a deferral. deferImmediately makes the button stop spinning right away.
			// which is probably bad UX.
			// otherwise, defer in 2.2 seconds if it looks like the function
			// might run past the 3 second response window
			const deferralDelay = deferImmediately ? 0 : 2200;
			const deferralMethod = () =>
				handlingData.update ? interaction.deferUpdate() : interaction.deferReply({ ephemeral });
			deferalCountdown = setTimeout(deferralMethod, deferralDelay);
		}

		try {
			let results: Sendable | Embed | string | void | Message | undefined;
			if (typeof handler === "function") {
				const channel =
					interaction.channel ??
					((await client.channels.fetch(interaction.channelId)) as TextBasedChannel | null);
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
			} else {
				results = handler;
			}
			// the response function finished. we can cancel the scheduled deferral
			deferalCountdown !== undefined && clearTimeout(deferalCountdown);

			if (results) {
				if (handlingData.update) {
					if (interaction.deferred) await interaction.editReply(sendableToMessageOptions(results));
					else await interaction.update(sendableToMessageOptions(results));
					// await updateComponent(interaction,);
				} else {
					if (!interaction.replied) {
						await replyOrEdit(interaction, {
							ephemeral,
							...sendableToInteractionReplyOptions(results),
						});
					}
				}
			}
		} catch (e) {
			deferalCountdown !== undefined && clearTimeout(deferalCountdown);
			console.log("caught error in a handler");
			console.log(e);
			await forceFeedback(interaction, { content: `⚠. ${e}`, ephemeral: true });
		}
	}
}

function unhandledInteraction(interaction: MessageComponentInteraction) {
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
			const returnOptions: Sendable = { components: [] };
			if (message.content) returnOptions.content = message.content;
			if (message.embeds) returnOptions.embeds = message.embeds;

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
