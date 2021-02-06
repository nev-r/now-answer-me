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
} from "discord.js";
import { arrayify } from "one-stone/array";

export function buildReactionFilter({
	users,
	notUsers,
	emoji,
	notEmoji,
}: {
	users?: string | string[];
	notUsers?: string | string[];
	emoji?: string | string[];
	notEmoji?: string | string[];
}) {
	users = users ? arrayify(users) : undefined;
	notUsers = notUsers ? arrayify(notUsers) : undefined;
	emoji = emoji ? arrayify(emoji) : undefined;
	notEmoji = notEmoji ? arrayify(notEmoji) : undefined;

	return (reaction: MessageReaction, user: User) => {
		return (
			(!users || users.includes(user.id)) &&
			(!notUsers || !notUsers.includes(user.id)) &&
			(!emoji || emoji.includes(reaction.emoji.name) || emoji.includes(reaction.emoji.id ?? "")) &&
			(!notEmoji ||
				(!notEmoji.includes(reaction.emoji.name) && !notEmoji.includes(reaction.emoji.id ?? "")))
		);
	};
}

/** try to do whatever func wants to do, but delete msg if there's an error */
export async function bugOut<T extends any>(
	msg: Message | undefined,
	func: (() => T) | (() => Promise<T>)
) {
	try {
		return await func();
	} catch (e) {
		msg?.deleted || (await msg?.delete().catch());
		throw e;
	}
}

export function normalizeID(
	resolvable: UserResolvable | ChannelResolvable | MessageResolvable | GuildResolvable
) {
	return typeof resolvable === "string" ? resolvable : ((resolvable as any).id as string);
}
