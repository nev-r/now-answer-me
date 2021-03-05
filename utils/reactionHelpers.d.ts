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
export declare function consumeReaction(__: Parameters<typeof consumeReactions>[0]): Promise<MessageReaction | undefined>;
/** like `consumeReaction` but accepts a `controller` param and returns an endEarly */
export declare function _consumeReaction_(__: Parameters<typeof _consumeReactions_>[0]): {
    endEarly: () => void;
    collectedReaction: Promise<MessageReaction | undefined>;
};
/**
 * consume reactions by deleting valid ones as they come in,
 * and return the collected reactions in standard awaitReactions format
 */
export declare function consumeReactions(__: {
    msg: Message;
    constraints?: ConstraintSet;
    awaitOptions?: AwaitReactionsOptions;
}): Promise<Collection<string, MessageReaction> | undefined>;
/** like `consumeReactions` but accepts a `controller` param and returns an endEarly */
export declare function _consumeReactions_({ msg, constraints, awaitOptions, controller, }: {
    msg: Message;
    constraints?: ConstraintSet;
    awaitOptions?: AwaitReactionsOptions;
    controller?: {
        messageGone: boolean;
        consumptionOk: Promise<any>;
    };
}): {
    endEarly: () => void;
    collectedReactions: Promise<Collection<string, MessageReaction> | undefined>;
};
export declare type ReactionFilter = (reaction: MessageReaction, user: User) => boolean;
export declare function buildReactionFilter({ users, notUsers, emoji, notEmoji, }: ConstraintSet): ReactionFilter;
