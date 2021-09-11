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

function decodeCustomId(customId: string) {
	let [interactionID, controlID] = customId.split(interactionIdSeparator);
	// these are the bare minimum that must decode properly
	if (!interactionID || !controlID)
		throw `invalid! interactionID:${interactionID} controlID:${controlID}`;
	return {
		/** lookup key for how to handle this interaction */
		interactionID,
		/** which control (button/select) was submitted */
		controlID,
	};
}

export function encodeCustomID(
	/** lookup key for how to handle this interaction */
	interactionID: string,
	/** a unique id for the control (button/select) */
	controlID: string
) {
	return interactionID + interactionIdSeparator + controlID;
}

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
	allowTimeout?: boolean;
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

// isnt it cooler to NOT unwrap a starburst in your mouth? just eat it. wax paper and all. badass 

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
						customId: encodeCustomID(interactionID, value),
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
		const customId = encodeCustomID(interactionID, controlID);
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
	const { interactionID, controlID } = decodeCustomId(interaction.customId);
	const handlingData = componentInteractions[interactionID];
	if (!handlingData) unhandledInteraction(interaction);
	else {
		const originalUser = interaction.message.interaction?.user.id;
		if (originalUser && interaction.user.id !== originalUser) {
			await interaction.deferUpdate();
			console.log("this isnt your control");
			return;
		}

		let { handler, ephemeral, deferImmediately, allowTimeout, update } = handlingData;

		let deferalCountdown: undefined | NodeJS.Timeout;

		// idk why we would want to timeout (shows an error message in discord), but..
		if (!allowTimeout) {
			// schedule a deferral. deferImmediately makes the button stop spinning right away.
			// which is probably bad UX.
			// otherwise, defer in 2.3 seconds if it looks like the function
			// might run past the 3 second response window
			const deferralDelay = deferImmediately ? 0 : 2300;
			const deferralMethod = () =>
				update ? interaction.deferUpdate() : interaction.deferReply({ ephemeral });
			deferalCountdown = setTimeout(deferralMethod, deferralDelay);
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
			// the response function finished. we can cancel the scheduled deferral
			deferalCountdown !== undefined && clearTimeout(deferalCountdown);

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
