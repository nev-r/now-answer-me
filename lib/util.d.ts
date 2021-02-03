/// <reference types="node" />
import Discord, { BufferResolvable, Channel, ChannelResolvable, EmojiResolvable, GuildResolvable, MessageResolvable, UserResolvable } from "discord.js";
import { ValidMessage } from "./bot.js";
/**
 * accepts the results of a `channel.send`, `await channel.send` or wraps a `channel.send`
 *
 * deletes message if someone reacts with wastebasket `🗑`, litter `🚮`, or cancel `🚫`
 */
export declare function makeTrashable(msg: Discord.Message | void | Promise<Discord.Message | void>, whoCanDelete?: string | string[]): Promise<void>;
/**
 * accepts a channel to post to, a list of `T`s, and a function that turns a `T` into a valid `MessageEmbed`
 *
 * posts embeds serially until all have been shown, `🎲` advances to the next one
 */
export declare function sendRerollableEmbed<T>(channel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel, remainingList: T[], renderer: (listItem: T) => Discord.MessageEmbed): Promise<void>;
/**
 * accepts a channel to post to, a list of `T`s, and a function that turns a `T` into a valid `MessageEmbed`
 */
export declare function sendPaginatedEmbed<T>(channel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel, contentList: T[], renderer: (listItem: T) => Discord.MessageEmbed): Promise<void>;
/**
 * accepts a channel to post to, a list of `T`s, and a function that turns a `T` into a valid element of a `MessageEmbed` field
 */
export declare function sendPaginatedSelector<T>({ user, channel, contentList, optionRenderer, resultRenderer, prompt, itemsPerPage, }: {
    user: Discord.User;
    channel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel;
    contentList: T[];
    optionRenderer: (listItem: T, index: number) => Discord.EmbedFieldData;
    resultRenderer: (listItem: T) => Discord.MessageEmbed;
    prompt?: string;
    itemsPerPage?: number;
}): Promise<void>;
/** wip */
export declare function promptForText({ channel, options, user, swallowResponse, awaitOptions, }: {
    channel: Discord.TextChannel;
    options: RegExp | string[];
    user?: UserResolvable | UserResolvable[];
    swallowResponse?: boolean;
    awaitOptions?: Discord.AwaitReactionsOptions;
}): Promise<{
    text: string;
    message: Discord.Message;
} | undefined>;
/**
 * posts 1 or more options (emoji) to a message,
 * and awaits a selection (someone clicking one, thereby increasing the count)
 *
 * returns which emoji was selected, or undefined if it timed out waiting
 *
 * cleanupReactions controls whose reactions to clean up after a choice is made
 */
export declare function presentOptions<T extends string>(msg: Discord.Message, options: T | T[], cleanupReactions?: "all" | "others", awaitOptions?: Discord.AwaitReactionsOptions): Promise<T | undefined>;
/**
 * simple function to apply `reactions` to `msg` in a set order
 */
export declare function serialReactions(msg: Discord.Message, reactions: string[]): Promise<void>;
export declare function singleReaction(msg: Discord.Message, reaction: string): Promise<void>;
export declare function announceToChannels(client: Discord.Client, message: ValidMessage, channelIds: string | string[]): (false | Promise<Discord.Message>)[];
/**
 * waits for client to be ready and then attempts to resolve a channel
 */
export declare function resolveChannel<T extends Channel>(channel: ChannelResolvable): Promise<T | null>;
/**
 * waits for client to be ready and then attempts to resolve an emoji
 */
export declare function resolveEmoji(emoji: EmojiResolvable): Promise<Discord.GuildEmoji | null>;
/**
 * waits for client to be ready and then attempts to resolve a guild
 */
export declare function resolveGuild(guild: GuildResolvable): Promise<Discord.Guild | null>;
/**
 * waits for client to be ready and then builds an emoji dict from a server or array of servers
 */
export declare function buildEmojiDict(guilds: GuildResolvable[]): Promise<NodeJS.Dict<Discord.GuildEmoji>>;
export declare function uploadEmojiList(guild: GuildResolvable, emoteList: {
    attachment: BufferResolvable;
    name: string;
}[]): Promise<Record<string, Discord.GuildEmoji>>;
/**
 * `Awaited<Promise<string>>`
 *
 * ↓↓↓↓
 *
 * `string`
 */
export declare type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;
export declare function normalizeID(resolvable: UserResolvable | ChannelResolvable | MessageResolvable | GuildResolvable): string;
