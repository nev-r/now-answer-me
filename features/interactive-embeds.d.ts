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
}): Promise<Message>;
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
}): Promise<Message>;
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
export declare function revengeOfSendPaginatedSelector<T>({ user, preexistingMessage, channel, cleanupReactions, optionRenderer, renderer, selectables, startPage, arrowButtons, randomButton, prompt, itemsPerPage, }: {
    user?: User;
    preexistingMessage?: Message;
    channel?: TextChannel | DMChannel | NewsChannel;
    cleanupReactions?: boolean;
    optionRenderer: (listItem: T, index: number) => EmbedFieldData;
    renderer?: (sourceData: any) => MessageEmbed | Promise<MessageEmbed>;
    selectables: T[];
    startPage?: number;
    arrowButtons?: boolean;
    randomButton?: boolean;
    prompt?: string;
    itemsPerPage?: number;
}): Promise<{
    selection: number | undefined;
    paginatedMessage: Message;
}>;
export declare function returnOfPaginator<T>({ user, preexistingMessage, channel, pages, renderer, startPage, arrowButtons, randomButton, }: {
    user?: User;
    preexistingMessage?: Message;
    channel?: TextChannel | DMChannel | NewsChannel;
    pages: T[];
    renderer: (sourceData: T) => MessageEmbed | Promise<MessageEmbed>;
    startPage?: number;
    arrowButtons?: boolean;
    randomButton?: boolean;
    prompt?: string;
    itemsPerPage?: number;
}): Promise<void>;
/**
 * accepts a channel to post to, a list of `T`s, and a function that turns a `T` into a valid element of a `MessageEmbed` field
 */
export declare function sendPaginatedSelector<T>({ preexistingMessage, user, channel, selectables, optionRenderer, resultRenderer, resultAction, prompt, itemsPerPage, }: {
    preexistingMessage?: Message;
    user: User;
    channel: TextChannel | DMChannel | NewsChannel;
    selectables: T[];
    optionRenderer: (listItem: T, index: number) => EmbedFieldData;
    resultRenderer?: (listItem: T) => Promise<MessageEmbed> | MessageEmbed;
    resultAction?: (selectorMessage: Message, choice: T) => Promise<void> | void;
    prompt?: string;
    itemsPerPage?: number;
}): Promise<void>;
