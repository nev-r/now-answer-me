/// <reference types="node" />
import type { Client, ChannelResolvable, GuildEmoji, GuildResolvable, MessageEmbed, MessageResolvable, BufferResolvable } from "discord.js";
export declare function buildEmojiDictUsingClient(client: Client, guilds: GuildResolvable | GuildResolvable[]): Promise<NodeJS.Dict<GuildEmoji>>;
export declare function sendMessageUsingClient(client: Client, channel: ChannelResolvable, content: string | MessageEmbed, publish?: boolean): Promise<import("discord.js").Message>;
export declare function editMessageUsingClient(client: Client, channel: ChannelResolvable, message: MessageResolvable, content: string | MessageEmbed): Promise<import("discord.js").Message>;
export declare function publishMessageUsingClient(client: Client, channel: ChannelResolvable, message: MessageResolvable): Promise<import("discord.js").Message>;
export declare function uploadEmojiListUsingClient(client: Client, guild: GuildResolvable, emoteList: {
    attachment: BufferResolvable;
    name: string;
}[]): Promise<Record<string, GuildEmoji>>;
export declare function sleep(ms: number): Promise<unknown>;
export declare function sleepUntil(date: number | Date): Promise<void>;
