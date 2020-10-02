import { ChannelResolvable, MessageEmbed, MessageResolvable } from "discord.js";
/**
 * logs into discord, sends a message to a specific channel, and logs out.
 * optionally crossposts/publishes it
 *
 * returns the message that was sent
 */
export declare function sendSingleMessage(apiToken: string, channel: ChannelResolvable, content: string | MessageEmbed, publish?: boolean): Promise<unknown>;
/**
 * logs into discord, publishes an existing message found in a specific channel, and logs out
 *
 * returns the message that was published
 */
export declare function publishSingleMessage(apiToken: string, channel: ChannelResolvable, message: MessageResolvable): Promise<unknown>;
/**
 * logs into discord, sends a message to a specific channel, and logs out.
 * optionally crossposts/publishes it
 *
 * returns the message that was sent
 */
export declare function editSingleMessage(apiToken: string, channel: ChannelResolvable, messageId: string, content: string | MessageEmbed): Promise<unknown>;
