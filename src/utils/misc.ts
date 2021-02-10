//
// delayed resolvers
//

import type { Message } from "discord.js";
import { arrayify } from "one-stone/array";

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
