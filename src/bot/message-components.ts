import {
	EmojiIdentifierResolvable,
	Guild,
	InteractionReplyOptions,
	MessageActionRow,
	MessageButton,
	MessageButtonStyleResolvable,
	MessageComponentInteraction,
	MessageEmbed,
	MessageSelectMenu,
	MessageSelectOptionData,
	TextBasedChannels,
	User,
} from "discord.js";
import { escMarkdown } from "one-stone/string";
import { Sendable } from "../types/types-bot.js";
import { Message } from "discord.js";
import { Awaitable } from "one-stone/types";
import { sendableToInteractionReplyOptions } from "../utils/misc.js";
import { arrayify } from "one-stone/array";
import { MessageButtonStyles } from "discord.js/typings/enums";

export const interactionIdSeparator = "␞";

export type ComponentInteractionHandlingData = {
	handler:
		| Sendable
		| ((_: {
				guild: Guild | null;
				channel: TextBasedChannels | null;
				user: User;
				interactionID: string;
				controlID: string;
				values?: string[];
		  }) => Awaitable<InteractionReplyOptions | MessageEmbed | string | undefined | void>);
	ephemeral?: boolean;
	deferImmediately?: boolean;
	deferIfLong?: boolean;
	update?: boolean;
};

export const componentInteractions: NodeJS.Dict<ComponentInteractionHandlingData> = {};

type InteractionButton = {
	disabled?: boolean;
	style: Exclude<MessageButtonStyleResolvable, "LINK" | MessageButtonStyles.LINK>;
	value: string;
} & (
	| { emoji: EmojiIdentifierResolvable; label: string }
	| { emoji?: undefined; label: string }
	| {
			emoji: EmojiIdentifierResolvable;
			label?: undefined;
	  }
);

type InteractionSelect = {
	controlID: string;
	disabled?: boolean;
	maxValues?: number;
	minValues?: number;
	options: MessageSelectOptionData[];
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

	return nestedButtons.map(
		(r) =>
			new MessageActionRow({
				components: r.map((b) => {
					const { value, ...rest } = b;
					return new MessageButton({
						customId: interactionID + interactionIdSeparator + value,
						...rest,
					});
				}),
			})
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

export async function routeComponentInteraction(interaction: MessageComponentInteraction) {
	let [interactionID, controlID] = interaction.customId.split(interactionIdSeparator);
	const handlingData = componentInteractions[interactionID];
	if (!handlingData) unhandledInteraction(interaction);
	else {
		let { handler, ephemeral, deferImmediately, deferIfLong, update } = handlingData;
		let deferalCountdown: undefined | NodeJS.Timeout;
		if (deferImmediately || deferIfLong) {
			deferalCountdown = setTimeout(
				() => (update ? interaction.deferUpdate() : interaction.deferReply({ ephemeral })),
				deferImmediately ? 0 : 2300
			);
		}
		try {
			let results: Sendable | Message | undefined;
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
			} else {
				results = handler;
			}
			deferalCountdown && clearTimeout(deferalCountdown);

			if (results && !update && !interaction.replied) {
				await interaction.reply({ ephemeral, ...sendableToInteractionReplyOptions(results) });
			}
			if (results && update) {
				await interaction.update(sendableToInteractionReplyOptions(results));
			}
		} catch (e) {
			await interaction.reply({ content: "⚠", ephemeral: true });
			console.log(e);
		}
	}
}

function unhandledInteraction(interaction: MessageComponentInteraction) {
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
