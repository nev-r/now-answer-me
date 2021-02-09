import type { Message, MessageReaction, User, Emoji, Channel, Guild, GuildMember, GuildEmoji, GuildChannel } from "discord.js";
export declare type ReactionFilter = (reaction: MessageReaction, user: User) => boolean;
export declare function buildReactionFilter({ users, notUsers, emoji, notEmoji, }: {
    users?: string | User | (string | User)[];
    notUsers?: string | User | (string | User)[];
    emoji?: string | Emoji | (string | Emoji)[];
    notEmoji?: string | Emoji | (string | Emoji)[];
}): ReactionFilter;
export declare function normalizeID(resolvable: User | Message | Channel | Message | Guild | GuildChannel | GuildMember | GuildEmoji | string): string;
export declare function normalizeName(resolvable: Emoji | GuildEmoji | string): string;
/** try to do whatever func wants to do, but delete msg if there's an error */
export declare function bugOut<T extends any>(msg: Message | undefined, func: (() => T) | (() => Promise<T>)): Promise<T>;
export declare function delMsg(msg?: Message): Promise<void>;
