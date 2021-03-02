//
// additional things you can do to an existing message
//

import type { MessageReaction, Message, User } from "discord.js";
import { arrayify } from "one-stone/array";
import { sleep } from "one-stone/promise";
import { delMsg } from "./misc.js";

type ReactionFilter = (reaction: MessageReaction, user: User) => boolean;

/**
 * deletes msg if someone reacts to it with any of
 * wastebasket `🗑`, litter `🚮`, or cancel `🚫`
 *
 * you can directly wrap a d.js send() or its results in this
 */
export async function makeTrashable(
	msg: Message | void | Promise<Message | void>,
	whoCanDelete?: string | string[]
) {
	msg = await msg;
	if (!msg) return;
	let reactionFilter: ReactionFilter = (reaction) => trashEmojis.includes(reaction.emoji.name);
	if (whoCanDelete) {
		const peopleList = arrayify(whoCanDelete);
		reactionFilter = (reaction, user) =>
			trashEmojis.includes(reaction.emoji.name) && peopleList.includes(user.id);
	}
	const userReactions = await msg.awaitReactions(reactionFilter, {
		max: 1,
		time: 300000,
	});
	if (userReactions.size) await delMsg(msg);
}
const trashEmojis = ["🚮", "🗑️", "🚫"];

/**
 * apply `reactions` to `msg`, in a set order, without complaining about errors
 */
export async function serialReactions(
	msg: Message,
	reactions: string[],
	abortController: { abort: boolean } = { abort: false }
) {
	for (const reaction of reactions) {
		!abortController.abort && (await singleReaction(msg, reaction));
	}
}

/**
 * apply `reaction` to `msg`, without complaining about errors
 */
export async function singleReaction(
	msg: Message,
	reaction: string,
	abortController: { abort: boolean } = { abort: false }
) {
	try {
		if (!abortController.abort && !msg.deleted && !msg.reactions.cache.get(reaction)?.me) {
			await msg.react(reaction);
			await sleep(800); // apparently discord rate limited this
		}
	} catch (e) {
		// nodeLog(`${reaction[0]}≠>${msg}`)();
	}
}

// function nodeLog(
//   any: Parameters<typeof process.stdout.write>[0]
// ): (_e: any) => void {
//   return (_e) => {
//     process.stdout.write(any);
//   };
// }
