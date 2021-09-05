import {
	Guild,
	InteractionReplyOptions,
	MessageActionRow,
	MessageButton,
	MessageButtonOptions,
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
	buttons: MessageButtonOptions[] | MessageButtonOptions;
	interactionID: string;
} & ComponentInteractionHandlingData) {
	componentInteractions[interactionID] = handlingData;
	return new MessageActionRow({ components: arrayify(buttons).map((b) => new MessageButton(b)) });
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
