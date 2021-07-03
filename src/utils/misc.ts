//
// delayed resolvers
//

import { Message, MessageEmbed, MessageOptions } from "discord.js";
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
		msg?.deletable && !msg.deleted && (await msg.delete());
	} catch (e) {
		console.log(e);
	}
	return;
}

export async function sendMsg(channel: Message["channel"], sendable: Sendable) {
	let toSend: (MessageOptions & { split?: false | undefined }) | undefined;
	if (sendable instanceof MessageEmbed) toSend = { embeds: [sendable] };
	else if (typeof sendable === "string") toSend = { content: sendable };
	else toSend = sendable;

	return channel.send(toSend);
}

export function boolFilter<T>(arr: T[]): NonNullable<T>[] {
	return arr.filter(Boolean) as NonNullable<T>[];
}
