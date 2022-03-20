//
// delayed resolvers
//

import {
	EmbedBuilder,
	InteractionReplyOptions,
	InteractionUpdateOptions,
	Message,
	MessageOptions,
	MessagePayload,
} from "discord.js";
import { APIEmbed } from "discord.js/node_modules/discord-api-types/v9";
import { Sendable } from "../types/types-discord.js";

/** try to do whatever func wants to do, but delete msg if there's an error */
export async function bugOut<T extends any>(
	msg: Message | undefined,
	func: (() => T) | (() => Promise<T>)
) {
	try {
		return await func();
	} catch (e) {
		await delMsg(msg);
		throw e;
	}
}

export async function delMsg(msg?: Message) {
	try {
		msg?.deletable && (await msg.delete());
	} catch (e) {
		console.log(e);
	}
	return;
}

/** deprecated i guess */
export async function sendMsg(channel: Message["channel"], sendable: Sendable) {
	let toSend: MessageOptions | MessagePayload | undefined;
	if (sendable instanceof EmbedBuilder) toSend = { embeds: [sendable] };
	else if (typeof sendable === "string") toSend = { content: sendable };
	else toSend = sendable;

	return channel.send(toSend);
}
// {
//   tts?: boolean;
//   nonce?: string | number;
//   content?: string | null;
//   embeds?: (JSONEncodable<APIEmbed> | APIEmbed)[];
//   components?: (
//     | JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent>>
//     | ActionRow<MessageActionRowComponent>
//     | (Required<BaseComponentData> & ActionRowData<MessageActionRowComponentData | MessageActionRowComponent>)
//     | APIActionRowComponent<APIMessageActionRowComponent>
//   )[];
//   allowedMentions?: MessageMentionOptions;
//   files?: (FileOptions | BufferResolvable | Stream | MessageAttachment)[];
//   reply?: ReplyOptions;
//   stickers?: StickerResolvable[];
//   attachments?: MessageAttachment[];
//   flags?: BitFieldResolvable<Extract<MessageFlagsString, 'SuppressEmbeds'>, number>;
// }
export function sendableToMessageOptions(
	sendable: Sendable
): Partial<Pick<MessageOptions, "components" | "content" | "files"> & { embeds?: APIEmbed[] }> {
	if (sendable instanceof EmbedBuilder) return { embeds: [sendable.data] };
	else if (typeof sendable === "string") return { content: sendable };
	else {
		const { content, embeds, components, files } = sendable;
		const embeds2 = embeds?.map((e) => ("toJSON" in e ? e.toJSON() : e));
		return { content, embeds: embeds2, components, files };
	}
}

export function sendableToInteractionReplyOptions(
	sendable: MessageOptions | InteractionReplyOptions | EmbedBuilder | string
) {
	if (sendable instanceof EmbedBuilder) return { embeds: [sendable] };
	else if (typeof sendable === "string") return { content: sendable };
	else return sendable;
}

export function sendableToInteractionUpdateOptions(
	sendable: MessageOptions | InteractionReplyOptions | EmbedBuilder | string
): InteractionUpdateOptions {
	if (sendable instanceof EmbedBuilder) return { embeds: [sendable.data] };
	else if (typeof sendable === "string") return { content: sendable };
	else
		return {
			...sendable,
			embeds: sendable.embeds?.map((e) => ("toJSON" in e ? e.toJSON() : e)),
			flags: undefined,
		};
}

export function sendableToPayload(sendable: MessagePayload | EmbedBuilder | string | Sendable) {
	if (sendable instanceof EmbedBuilder) return { embeds: [sendable] };
	else if (typeof sendable === "string") return { content: sendable };
	else return sendable;
}

export function boolFilter<T>(arr: T[]): NonNullable<T>[] {
	return arr.filter(Boolean) as NonNullable<T>[];
}
