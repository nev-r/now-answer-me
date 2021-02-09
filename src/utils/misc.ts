//
// delayed resolvers
//

import type {
	ChannelResolvable,
	GuildResolvable,
	MessageResolvable,
	UserResolvable,
	Message,
	MessageReaction,
	User,
	Emoji,
	Channel,
	Guild,
	GuildMember,
	GuildEmoji,
	GuildChannel,
} from "discord.js";
import { arrayify } from "one-stone/array";

export type ReactionFilter = (reaction: MessageReaction, user: User) => boolean;

export function buildReactionFilter({
	users,
	notUsers,
	emoji,
	notEmoji,
}: {
	users?: string | User | (string | User)[];
	notUsers?: string | User | (string | User)[];
	emoji?: string | Emoji | (string | Emoji)[];
	notEmoji?: string | Emoji | (string | Emoji)[];
}): ReactionFilter {
	const userIDs = users ? arrayify(users).map(normalizeID) : undefined;
	const notUsersIDs = notUsers ? arrayify(notUsers).map(normalizeID) : undefined;
	const emojiNamesIDs = emoji
		? arrayify(emoji)
				.flatMap((e) => [normalizeName(e), typeof e === "string" ? "" : e.id!])
				.filter(Boolean)
		: undefined;
	const notEmojiNamesIDs = notEmoji
		? arrayify(notEmoji)
				.flatMap((e) => [normalizeName(e), typeof e === "string" ? "" : e.id!])
				.filter(Boolean)
		: undefined;

	return (reaction, user) => {
		return (
			// no limits or a limit matches
			(!userIDs || userIDs.includes(user.id)) &&
			// no limits or no limits match
			(!notUsersIDs || !notUsersIDs.includes(user.id)) &&
			// no limits or a limit matches
			(!emojiNamesIDs ||
				emojiNamesIDs.includes(reaction.emoji.name) ||
				emojiNamesIDs.includes(reaction.emoji.id!)) &&
			// no limits or no limits match
			(!notEmojiNamesIDs ||
				(!notEmojiNamesIDs.includes(reaction.emoji.name) &&
					!notEmojiNamesIDs.includes(reaction.emoji.id!)))
		);
	};
}

export function normalizeID(
	resolvable:
		| User
		| Message
		| Channel
		| Message
		| Guild
		| GuildChannel
		| GuildMember
		| GuildEmoji
		| string
) {
	return typeof resolvable === "string" ? resolvable : resolvable.id;
}
export function normalizeName(resolvable: Emoji | GuildEmoji | string) {
	return typeof resolvable === "string" ? resolvable : resolvable.name;
}

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
