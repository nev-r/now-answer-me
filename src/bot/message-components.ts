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

const nul = "␀";

type ComponentInteractionHandlingData = {
	handler:
		| Sendable
		| (({
				guild,
				channel,
				user,
				interactionID,
				controlID,
		  }: {
				guild: Guild | null;
				channel: TextBasedChannels | null;
				user: User;
				interactionID: string;
				controlID: string;
		  }) => Awaitable<InteractionReplyOptions | MessageEmbed | string | undefined | void>);
	ephemeral?: boolean;
	deferImmediately?: boolean;
	deferIfLong?: boolean;
};

const componentInteractions: NodeJS.Dict<ComponentInteractionHandlingData> = {};

export function createComponentInteraction({
	interactionID,
	buttons,
	...handlingData
}: {
	buttons: { disabled?: boolean; emoji?: EmojiIdentifierResolvable; label: string } & {
		style: Exclude<MessageButtonStyleResolvable, "LINK" | MessageButtonStyles.LINK>;
		value: string;
	};
	interactionID: string;
} & ComponentInteractionHandlingData) {
	componentInteractions[interactionID] = handlingData;
	const { value, ...rest } = buttons;
	return new MessageActionRow({
		components: arrayify(buttons).map(
			(b) => new MessageButton({ customId: interactionID + nul + value, ...rest })
		),
	});
}

export async function routeComponentInteraction(interaction: MessageComponentInteraction) {
	let [interactionID, controlID] = interaction.customId.split(nul);
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

				results =
					(await handler({
						channel,
						guild,
						user,
						interactionID,
						controlID,
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
