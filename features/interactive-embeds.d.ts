import type { Message, TextChannel, DMChannel, NewsChannel, User, EmbedFieldData } from "discord.js";
import { MessageEmbed } from "discord.js";
/**
 * accepts a channel to post to, and a collection of pages to
 * let users switch between
 *
 * in this implementation, each page is a MessageEmbed
 */
export declare function sendPaginatedEmbed<T>(_: ({
    preexistingMessage?: undefined;
    channel: TextChannel | DMChannel | NewsChannel;
} | {
    preexistingMessage: Message;
    channel?: undefined;
}) & {
    pages: MessageEmbed[];
    renderer?: undefined;
    startPage?: number;
}): Promise<{
    paginatedMessage: Message;
    page: Promise<number | undefined>;
}>;
/**
 * accepts a channel to post to, and a collection of pages to
 * let users switch between
 *
 * in this implementation each page is source data for a
 * renderer function, which turns a page into a MessageEmbed
 *
 * this can be used to defer heavy or async page rendering,
 * until that page is navigated to
 */
export declare function sendPaginatedEmbed<T>(_: ({
    preexistingMessage?: undefined;
    channel: TextChannel | DMChannel | NewsChannel;
} | {
    preexistingMessage: Message;
    channel?: undefined;
}) & {
    pages: T[];
    renderer: (sourceData: T) => MessageEmbed | Promise<MessageEmbed>;
    startPage?: number;
}): Promise<{
    paginatedMessage: Message;
    page: Promise<number | undefined>;
}>;
/**
 * accepts a channel to post to, and a collection of "pages" to let users randomly switch between
 *
 * in this implementation, each page is a MessageEmbed
 */
export declare function sendRerollableEmbed<T>(_: {
    channel: TextChannel | DMChannel | NewsChannel;
    pages: MessageEmbed[];
    renderer?: undefined;
}): Promise<Message>;
/**
 * accepts a channel to post to, and a collection of "pages" to let users randomly switch between
 *
 * in this implementation each page is source data for a renderer function, which turns a page into a MessageEmbed
 *
 * this can be used to defer heavy or async page rendering, until that page is navigated to
 */
export declare function sendRerollableEmbed<T>(_: {
    channel: TextChannel | DMChannel | NewsChannel;
    pages: T[];
    renderer: (sourceData: T) => MessageEmbed | Promise<MessageEmbed>;
}): Promise<Message>;
/**
 * accepts a channel to post to, and a collection of "pages" to let users randomly switch between. each page can only be viewed once
 *
 * in this implementation, each page is a MessageEmbed
 */
export declare function sendRerollableStackEmbed<T>(_: {
    channel: TextChannel | DMChannel | NewsChannel;
    pages: MessageEmbed[];
    renderer?: undefined;
}): Promise<Message>;
/**
 * accepts a channel to post to, and a collection of "pages" to let users randomly switch between. each page can only be viewed once
 *
 * in this implementation each page is source data for a renderer function, which turns a page into a MessageEmbed
 *
 * this can be used to defer heavy or async page rendering, until that page is navigated to
 */
export declare function sendRerollableStackEmbed<T>(_: {
    channel: TextChannel | DMChannel | NewsChannel;
    pages: T[];
    renderer: (sourceData: T) => MessageEmbed | Promise<MessageEmbed>;
}): Promise<Message>;
/**
 * accepts a channel to post to or an existing bot-owned message to edit,
 * and a collection of options to let users select from
 *
 * in this implementation, each selectable is already an EmbedField
 * (an object with the keys "name", "value", and optionally "inline")
 */
export declare function sendPaginatedSelector<T>(_: {
    user?: User;
    preexistingMessage?: Message;
    channel?: TextChannel | DMChannel | NewsChannel;
    cleanupReactions?: boolean;
    selectables: EmbedFieldData[];
    prompt?: string;
    itemsPerPage?: number;
    waitTime?: number;
}): Promise<{
    paginatedMessage: Message;
    selection: Promise<number | undefined>;
}>;
/**
 * accepts a channel to post to or an existing bot-owned message to edit,
 * and a collection of options to let users select from
 *
 * in this implementation, an optionRenderer is included which can convert
 * a selectable to an EmbedFieldData
 */
export declare function sendPaginatedSelector<T>(_: {
    user?: User;
    preexistingMessage?: Message;
    channel?: TextChannel | DMChannel | NewsChannel;
    cleanupReactions?: boolean;
    optionRenderer?: (selectable: T, index: number) => EmbedFieldData;
    selectables: T[];
    prompt?: string;
    itemsPerPage?: number;
    waitTime?: number;
}): Promise<{
    paginatedMessage: Message;
    selection: Promise<number | undefined>;
}>;
