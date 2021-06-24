/// <reference types="node" />
import type { Client, ChannelResolvable, GuildEmoji, GuildResolvable, MessageEmbed, MessageResolvable, UserResolvable, GuildEmojiManager, Snowflake } from "discord.js";
import { Sendable } from "../types/types-discord.js";
export declare function buildEmojiDictUsingClient(client: Client, guilds: GuildResolvable | GuildResolvable[]): Promise<NodeJS.Dict<GuildEmoji>>;
export declare function sendMessageUsingClient(client: Client, channel: ChannelResolvable, content: string | MessageEmbed, publish?: boolean): Promise<import("discord.js").Message>;
export declare function getDMChannelUsingClient(client: Client, user: UserResolvable): Promise<import("discord.js").DMChannel>;
export declare function editMessageUsingClient(client: Client, channel: ChannelResolvable, message: MessageResolvable, content: string | MessageEmbed): Promise<import("discord.js").Message>;
export declare function publishMessageUsingClient(client: Client, channel: ChannelResolvable, message: MessageResolvable): Promise<import("discord.js").Message>;
declare type EmojiAttachment = Parameters<GuildEmojiManager["create"]>[0];
declare type EmojiName = Parameters<GuildEmojiManager["create"]>[1];
export declare function uploadEmojisUsingClient(client: Client, guild: GuildResolvable, emojis: {
    attachment: EmojiAttachment;
    name: EmojiName;
}[]): Promise<Record<string, GuildEmoji>>;
export declare function announceToChannels(client: Client, message: Sendable, channelIds: Snowflake | Snowflake[]): (false | Promise<import("discord.js").Message>)[];
export {};
