//
// delayed resolvers
//

import {
	Embed,
	InteractionReplyOptions,
	Message,
	MessageOptions,
	MessagePayload,
} from "discord.js";
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
	if (sendable instanceof Embed) toSend = { embeds: [sendable] };
	else if (typeof sendable === "string") toSend = { content: sendable };
	else toSend = sendable;

	return channel.send(toSend);
}

export function sendableToMessageOptions(sendable: Sendable) {
	if (sendable instanceof Embed) return { embeds: [sendable] };
	else if (typeof sendable === "string") return { content: sendable };
	else return sendable;
}
export function sendableToInteractionReplyOptions(
	sendable: MessageOptions | InteractionReplyOptions | Embed | string
) {
	if (sendable instanceof Embed) return { embeds: [sendable] };
	else if (typeof sendable === "string") return { content: sendable };
	else return sendable;
}

export function sendableToPayload(sendable: MessagePayload | Embed | string | Sendable) {
	if (sendable instanceof Embed) return { embeds: [sendable] };
	else if (typeof sendable === "string") return { content: sendable };
	else return sendable;
}

export function boolFilter<T>(arr: T[]): NonNullable<T>[] {
	return arr.filter(Boolean) as NonNullable<T>[];
}
