/// <reference types="node" />
import type { Client, ChannelResolvable, GuildEmoji, GuildResolvable, MessageEmbed, MessageResolvable, UserResolvable, GuildEmojiManager, Snowflake, CommandInteraction, MessageComponentInteraction } from "discord.js";
import { Sendable } from "../types/types-discord.js";
export declare function buildEmojiDictUsingClient(client: Client, guilds: GuildResolvable | GuildResolvable[]): NodeJS.Dict<GuildEmoji>;
export declare function sendMessageUsingClient(client: Client, channel: ChannelResolvable, content: string | MessageEmbed, publish?: boolean): Promise<import("discord.js").Message<boolean>>;
export declare function getDMChannelUsingClient(client: Client, user: UserResolvable): Promise<import("discord.js").DMChannel>;
export declare function editMessageUsingClient(client: Client, channel: ChannelResolvable, message: MessageResolvable, content: string | MessageEmbed): Promise<import("discord.js").Message<boolean>>;
export declare function publishMessageUsingClient(client: Client, channel: ChannelResolvable, message: MessageResolvable): Promise<import("discord.js").Message<boolean>>;
declare type EmojiAttachment = Parameters<GuildEmojiManager["create"]>[0];
declare type EmojiName = Parameters<GuildEmojiManager["create"]>[1];
export declare function uploadEmojisUsingClient(client: Client, guild: GuildResolvable, emojis: {
    attachment: EmojiAttachment;
    name: EmojiName;
}[]): Promise<Record<string, GuildEmoji>>;
export declare function announceToChannels(client: Client, message: Sendable, channelIds: Snowflake | Snowflake[]): (false | Promise<import("discord.js").Message<boolean>>)[];
export declare function replyOrEdit(interaction: CommandInteraction | MessageComponentInteraction, content: Parameters<CommandInteraction["reply"]>[0] | Parameters<CommandInteraction["editReply"]>[0]): Promise<void>;
export declare function updateComponent(interaction: MessageComponentInteraction, content: Parameters<MessageComponentInteraction["editReply"]>[0]): Promise<void>;
/**
 * provide in-discord feedback to an interaction,
 * whether that's an initial reply, an edit to a deferral,
 * or a completely separate followup message
 */
export declare function forceFeedback(interaction: CommandInteraction | MessageComponentInteraction, content: Parameters<CommandInteraction["followUp"]>[0] | Parameters<CommandInteraction["reply"]>[0] | Parameters<CommandInteraction["editReply"]>[0]): Promise<void>;
export {};
