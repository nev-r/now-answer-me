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
	AwaitReactionsOptions,
	Collection,
} from "discord.js";
import { ReactionFilter, buildReactionFilter } from "../utils/misc.js";

/**
 * listens for, consumes, and yields one reaction at a time,
 * matching collectorParams.constraints, returning nothing when exhausted
 */
export async function* serialReactionMonitor({
	limit,
	...collectorParams
}: Parameters<typeof consumeReactions>[0] & { limit?: number }) {
	let i = 0;
	while (!limit || i++ < limit) {
		const reaction = await consumeReaction(collectorParams);
		if (!reaction) return;
		yield reaction;
	}
}

/**
 * "consume" a single reaction by deleting reactions as they come in,
 * and returning the reaction once a match is found
 */
export async function consumeReaction(...params: Parameters<typeof consumeReactions>) {
	params[0].awaitOptions ??= { max: 1, time: 60000 };
	params[0].awaitOptions.max = 1;
	return (await consumeReactions(...params))?.first();
}

/**
 * consume reactions by deleting valid ones as they come in,
 * and return the collected reactions in standard awaitReactions format
 */
export async function consumeReactions({
	msg,
	constraints = {},
	awaitOptions = { max: 3, time: 60000 },
	cancelCondition = () => false,
}: {
	msg: Message;
	constraints?: {
		users?: string | User | (string | User)[];
		notUsers?: string | User | (string | User)[];
		emoji?: string | Emoji | (string | Emoji)[];
		notEmoji?: string | Emoji | (string | Emoji)[];
	};
	awaitOptions?: AwaitReactionsOptions;
	cancelCondition?: () => boolean;
}) {
	// holds a emoji+user combo string briefly, to de-duplicate reaction deletions
	// const removed = new Set<string>();
	const reactionFilter = buildReactionFilter(constraints ?? {});

	const collector = msg.createReactionCollector(reactionFilter, awaitOptions); //  awaitReactions(filter, options = {}) {

	return new Promise<Collection<string, MessageReaction> | undefined>((resolve) => {
		collector.on("collect", (reaction, user) => {
			if (cancelCondition()) return;
			if (!reactionFilter(reaction, user)) return;
			// const identifier = `${reaction.emoji.name}${user.id}`;
			// if (removed.has(identifier)) return;
			// removed.add(identifier);
			reaction.users.remove(user);
			// setTimeout(() => removed.delete(identifier), 500);
		});

		collector.once("end", (reactions) => resolve(reactions.size ? reactions : undefined));
	});
}

// // checks for reactions we want
// // const reactionFilter = buildReactionFilter(constraints ?? {});
// // obeys the above filter, but as it's checking, removes the reactions
// const reactionFilterAndSaver: ReactionFilter = (reaction, user) => {
// 	if (!reactionFilter(reaction, user)) return false;
// 	const identifier = `${reaction.emoji.name}${user.id}`;
// 	if (!removed.has(identifier)) {
// 		removed.add(identifier);
// 		reaction.users.remove(user);
// 		setTimeout(() => removed.delete(identifier), 500);
// 	}
// 	return true;
// };

// const reactionCollection = await msg.awaitReactions(reactionFilterAndSaver, awaitOptions);
// if (!reactionCollection.size) return;
// return reactionCollection;
// }
