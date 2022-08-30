/// <reference types="node" />
import { Client, ChannelResolvable, GuildEmoji, GuildResolvable, MessageResolvable, UserResolvable, GuildEmojiManager, Snowflake, CommandInteraction, MessageComponentInteraction, EmbedBuilder, ModalSubmitInteraction } from "discord.js";
import { Sendable } from "../types/types-discord.js";
export declare function buildEmojiDictUsingClient(client: Client, guilds: GuildResolvable | GuildResolvable[]): NodeJS.Dict<GuildEmoji>;
export declare function sendMessageUsingClient(client: Client, channel: ChannelResolvable, content: string | EmbedBuilder, publish?: boolean): Promise<import("discord.js").Message<true>>;
export declare function getDMChannelUsingClient(client: Client, user: UserResolvable): Promise<import("discord.js").DMChannel>;
export declare function editMessageUsingClient(client: Client, channel: ChannelResolvable, message: MessageResolvable, content: string | EmbedBuilder): Promise<import("discord.js").Message<true> | import("discord.js").Message<false>>;
export declare function publishMessageUsingClient(client: Client, channel: ChannelResolvable, message: MessageResolvable): Promise<import("discord.js").Message<true>>;
export declare function uploadEmojisUsingClient(client: Client, guild: GuildResolvable, emojis: Parameters<GuildEmojiManager["create"]>[0][]): Promise<Record<string, GuildEmoji>>;
export declare function announceToChannels(client: Client, message: Sendable, channelIds: Snowflake | Snowflake[]): (false | Promise<import("discord.js").Message<true>> | Promise<import("discord.js").Message<false>> | undefined)[];
export declare function replyOrEdit(interaction: CommandInteraction | MessageComponentInteraction, content: Parameters<CommandInteraction["reply"]>[0] | Parameters<CommandInteraction["editReply"]>[0]): Promise<void>;
/**
 * provide in-discord feedback to an interaction,
 * whether that's an initial reply, an edit to a deferral,
 * or a completely separate followup message
 */
export declare function forceFeedback(interaction: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction, content: Parameters<CommandInteraction["followUp"]>[0] | Parameters<CommandInteraction["reply"]>[0] | Parameters<CommandInteraction["editReply"]>[0]): Promise<void>;
