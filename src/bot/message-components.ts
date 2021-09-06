import {
	EmojiIdentifierResolvable,
	Guild,
	InteractionReplyOptions,
	MessageActionRow,
	MessageButton,
	MessageButtonOptions,
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

const separator = "␞";

type ComponentInteractionHandlingData = {
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
};

const componentInteractions: NodeJS.Dict<ComponentInteractionHandlingData> = {};

type InteractionButton = {
	disabled?: boolean;
	emoji?: EmojiIdentifierResolvable;
	label: string;
	style: Exclude<MessageButtonStyleResolvable, "LINK" | MessageButtonStyles.LINK>;
	value: string;
};

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
					return new MessageButton({ customId: interactionID + separator + value, ...rest });
				}),
			})
	);
}

export function createComponentSelects({
	interactionID,
	selects,
	...handlingData
}: {
	selects: InteractionSelect | InteractionSelect[] | InteractionSelect[][];
	interactionID: string;
} & ComponentInteractionHandlingData) {
	componentInteractions[interactionID] = handlingData;
	const nestedSelects: InteractionSelect[][] = Array.isArray(selects)
		? Array.isArray(selects[0])
			? (selects as InteractionSelect[][])
			: [selects as InteractionSelect[]]
		: [[selects]];
	return nestedSelects.map(
		(r) =>
			new MessageActionRow({
				components: r.map((b) => {
					const { controlID, ...rest } = b;
					return new MessageSelectMenu({
						customId: interactionID + separator + controlID,
						...rest,
					});
				}),
			})
	);
}

export async function routeComponentInteraction(interaction: MessageComponentInteraction) {
	let [interactionID, controlID] = interaction.customId.split(separator);
	const handlingData = componentInteractions[interactionID];
	if (!handlingData) unhandledInteraction(interaction);
	else {
		let { handler, ephemeral, deferImmediately, deferIfLong } = handlingData;
		let deferalCountdown: undefined | NodeJS.Timeout;
		if (deferImmediately || deferIfLong) {
			deferalCountdown = setTimeout(
				() => interaction.deferReply({ ephemeral }),
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

			if (results && !interaction.replied) {
				await interaction.reply({ ephemeral, ...sendableToInteractionReplyOptions(results) });
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
