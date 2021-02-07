import type { Channel, ChannelResolvable, EmojiResolvable, GuildResolvable } from "discord.js";
/**
 * waits for client to be ready and then attempts to resolve a channel
 */
export declare function resolveChannel<T extends Channel>(channel: ChannelResolvable): Promise<T | null>;
/**
 * waits for client to be ready and then attempts to resolve an emoji
 */
export declare function resolveEmoji(emoji: EmojiResolvable): Promise<import("discord.js").GuildEmoji | null>;
/**
 * waits for client to be ready and then attempts to resolve a guild
 */
export declare function resolveGuild(guild: GuildResolvable): Promise<import("discord.js").Guild | null>;
