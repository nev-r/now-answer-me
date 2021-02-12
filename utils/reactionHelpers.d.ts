import type { Message, MessageReaction, User, AwaitReactionsOptions, Collection } from "discord.js";
import { ConstraintSet } from "../types/types-bot.js";
/**
 * listens for, consumes, and yields one reaction at a time,
 * matching collectorParams.constraints, returning nothing when exhausted
 */
export declare function serialReactionMonitor({ limit, ...collectorParams }: Parameters<typeof consumeReactions>[0] & {
    limit?: number;
}): AsyncGenerator<MessageReaction, void, unknown>;
/**
 * "consume" a single reaction by deleting reactions as they come in,
 * and returning the reaction once a match is found
 */
export declare function consumeReaction(...params: Parameters<typeof consumeReactions>): Promise<MessageReaction | undefined>;
/**
 * consume reactions by deleting valid ones as they come in,
 * and return the collected reactions in standard awaitReactions format
 */
export declare function consumeReactions({ msg, constraints, awaitOptions, cancelCondition, }: {
    msg: Message;
    constraints?: ConstraintSet;
    awaitOptions?: AwaitReactionsOptions;
    cancelCondition?: () => boolean;
}): Promise<Collection<string, MessageReaction> | undefined>;
export declare type ReactionFilter = (reaction: MessageReaction, user: User) => boolean;
export declare function buildReactionFilter({ users, notUsers, emoji, notEmoji, }: ConstraintSet): ReactionFilter;
