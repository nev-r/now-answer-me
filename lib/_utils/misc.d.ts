import type { ChannelResolvable, GuildResolvable, MessageResolvable, UserResolvable, Message, MessageReaction, User } from "discord.js";
export declare function buildReactionFilter({ users, notUsers, emoji, notEmoji, }: {
    users?: string | string[];
    notUsers?: string | string[];
    emoji?: string | string[];
    notEmoji?: string | string[];
}): (reaction: MessageReaction, user: User) => boolean;
/** try to do whatever func wants to do, but delete msg if there's an error */
export declare function bugOut<T extends any>(msg: Message | undefined, func: (() => T) | (() => Promise<T>)): Promise<T>;
export declare function normalizeID(resolvable: UserResolvable | ChannelResolvable | MessageResolvable | GuildResolvable): string;
