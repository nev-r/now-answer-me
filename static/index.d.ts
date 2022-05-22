/// <reference types="node" />
import type { BufferResolvable, ChannelResolvable, EmbedBuilder, GuildResolvable, MessageResolvable } from "discord.js";
/**
 * logs into discord, sends a message to a specific channel, and logs out.
 * optionally crossposts/publishes it
 *
 * returns the message that was sent
 */
export declare function sendSingleMessage(apiToken: string, channel: ChannelResolvable, content: string | EmbedBuilder, publish?: boolean): Promise<import("discord.js").Message<boolean>>;
/**
 * logs into discord, publishes an existing message found in a specific channel, and logs out
 *
 * returns the message that was published
 */
export declare function publishSingleMessage(apiToken: string, channel: ChannelResolvable, message: MessageResolvable): Promise<import("discord.js").Message<boolean>>;
/**
 * logs into discord, sends a message to a specific channel, and logs out
 *
 * returns the message that was edited
 */
export declare function editSingleMessage(apiToken: string, channel: ChannelResolvable, messageId: MessageResolvable, content: string | EmbedBuilder): Promise<import("discord.js").Message<boolean>>;
/**
 * logs into discord, and builds an emoji dict from a server or array of servers
 *
 * returns the emoji dict
 */
export declare function staticBuildEmojiDict(apiToken: string, guilds: GuildResolvable | GuildResolvable[]): Promise<NodeJS.Dict<import("discord.js").GuildEmoji>>;
/**
 * makes sure an array of emoji is all uploaded to a server. doesnt delete to make room though, so. unreliable.
 *
 * returns the emoji dict
 */
export declare function uploadEmojis(apiToken: string, guild: GuildResolvable, emojis: {
    attachment: BufferResolvable;
    name: string;
}[]): Promise<Record<string, import("discord.js").GuildEmoji>>;
/**
 * makes sure an array of emoji is all uploaded, potentially across multiple servers.
 *
 * returns the emoji dict
 */
export declare function dynamicUploadEmojis(apiToken: string, guilds: string[], emojis: {
    attachment: BufferResolvable;
    name: string;
}[]): Promise<NodeJS.Dict<import("discord.js").GuildEmoji>>;
