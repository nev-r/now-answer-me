/// <reference types="node" />
import Discord, { ChannelResolvable, GuildResolvable, MessageEmbed, MessageResolvable } from "discord.js";
/**
 * logs into discord, sends a message to a specific channel, and logs out.
 * optionally crossposts/publishes it
 *
 * returns the message that was sent
 */
export declare function sendSingleMessage(apiToken: string, channel: ChannelResolvable, content: string | MessageEmbed, publish?: boolean): Promise<Discord.Message>;
/**
 * logs into discord, publishes an existing message found in a specific channel, and logs out
 *
 * returns the message that was published
 */
export declare function publishSingleMessage(apiToken: string, channel: ChannelResolvable, message: MessageResolvable): Promise<Discord.Message>;
/**
 * logs into discord, sends a message to a specific channel, and logs out.
 * optionally crossposts/publishes it
 *
 * returns the message that was sent
 */
export declare function editSingleMessage(apiToken: string, channel: ChannelResolvable, messageId: string, content: string | MessageEmbed): Promise<Discord.Message>;
/**
 * logs into discord, sends a message to a specific channel, and logs out.
 * optionally crossposts/publishes it
 *
 * returns the message that was sent
 */
export declare function buildStaticEmojiDict(apiToken: string, guilds: GuildResolvable | GuildResolvable[]): Promise<NodeJS.Dict<Discord.GuildEmoji>>;
