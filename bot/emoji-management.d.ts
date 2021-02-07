/// <reference types="node" />
import type { GuildResolvable } from "discord.js";
import { uploadEmojisUsingClient } from "../utils/raw-utils.js";
/**
 * waits for client to be ready and then builds an emoji dict from a server or array of servers
 */
export declare function buildEmojiDict(guilds: GuildResolvable[]): Promise<NodeJS.Dict<import("discord.js").GuildEmoji>>;
/**
 * waits for client to be ready and then uploads some emoji
 */
export declare function uploadEmojis(guild: GuildResolvable, emojis: Parameters<typeof uploadEmojisUsingClient>[2]): Promise<Record<string, import("discord.js").GuildEmoji>>;
