import {
	EmbedBuilder,
	Guild,
	ModalBuilder,
	ModalSubmitInteraction,
	TextBasedChannel,
	User,
} from "discord.js";
import { Sendable } from "../types/types-bot.js";
import { Message } from "discord.js";
import { Awaitable } from "one-stone/types";
import { sendableToMessageOptions } from "../utils/misc.js";
import { forceFeedback } from "../utils/raw-utils.js";
import { client } from "./index.js";
import { unhandledInteraction } from "./message-components.js";

export type ModalHandlingData = {
	handler:
		| Sendable
		| ((_: {
				guild: Guild | null;
				channel: TextBasedChannel | null;
				user: User;
				textFields: NodeJS.Dict<string>;
		  }) => Awaitable<Sendable | undefined | void>);
	ephemeral?: boolean;
	deferImmediately?: boolean;
	allowTimeout?: boolean;
};

export const modalHandlers: NodeJS.Dict<ModalHandlingData> = {};

export function registerModal({
	interactionID,
	modal,
	...handlingData
}: {
	modal: ModalBuilder;
	interactionID: string;
} & ModalHandlingData) {
	modalHandlers[interactionID] = handlingData;
	modal.setCustomId(interactionID);
	return modal;
}

export async function routeModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
	const handlingData = modalHandlers[interaction.customId];
	if (!handlingData) unhandledInteraction(interaction);
	else {
		let { handler, ephemeral, deferImmediately, allowTimeout } = handlingData;
		const textFields: NodeJS.Dict<string> = {};
		interaction.fields.fields.forEach((f) => (textFields[f.customId] = f.value));

		let deferalCountdown: undefined | NodeJS.Timeout;

		// idk why we would want to timeout (shows an error message in discord), but..
		if (!allowTimeout) {
			// schedule a deferral. deferImmediately makes the button stop spinning right away.
			// which is probably bad UX.
			// otherwise, defer in 2.2 seconds if it looks like the function
			// might run past the 3 second response window
			const deferralDelay = deferImmediately ? 0 : 2200;
			const deferralMethod = () => interaction.deferReply({ ephemeral });
			deferalCountdown = setTimeout(deferralMethod, deferralDelay);
		}

		try {
			let results: Sendable | EmbedBuilder | string | void | Message | undefined;
			if (typeof handler === "function") {
				const channel =
					interaction.channel ??
					((await client.channels.fetch(interaction.channelId!)) as TextBasedChannel | null);

				const { guild, user } = interaction;
				results =
					(await handler({
						guild,
						channel,
						user,
						textFields,
					})) || "";
			} else {
				results = handler;
			}
			// the response function finished. we can cancel the scheduled deferral
			deferalCountdown !== undefined && clearTimeout(deferalCountdown);

			if (results) {
				if (!interaction.replied) {
					await interaction.reply(sendableToMessageOptions(results));
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
