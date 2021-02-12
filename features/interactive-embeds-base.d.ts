import type { Message, TextChannel, DMChannel, NewsChannel, User, EmbedFieldData } from "discord.js";
import { MessageEmbed } from "discord.js";
declare const reactOptions: {
    arrows: ("⬅️" | "➡️")[];
    random: "🎲"[];
    arrowsRandom: ("⬅️" | "➡️" | "🎲")[];
};
export declare function _newPaginatedSelector_<T>({ user, preexistingMessage, channel, cleanupReactions, optionRenderer, selectables, startPage, buttons, prompt, itemsPerPage, timeToWait, }: {
    user?: User;
    preexistingMessage?: Message;
    channel?: TextChannel | DMChannel | NewsChannel;
    cleanupReactions?: boolean;
    optionRenderer?: (listItem: any, index: number) => EmbedFieldData;
    selectables: (T | EmbedFieldData)[];
    startPage?: number;
    buttons?: keyof typeof reactOptions;
    prompt?: string;
    itemsPerPage?: number;
    timeToWait?: number;
}): Promise<{
    paginatedMessage: Message;
    selection: Promise<number | undefined>;
}>;
export declare function _newPaginatedEmbed_({ user, preexistingMessage, channel, pages, renderer, startPage, buttons, timeToWait, }: {
    user?: User;
    preexistingMessage?: Message;
    channel?: TextChannel | DMChannel | NewsChannel;
    pages: any[];
    renderer?: (sourceData: any) => MessageEmbed | Promise<MessageEmbed>;
    startPage?: number;
    buttons?: keyof typeof reactOptions;
    timeToWait?: number;
}): Promise<{
    paginatedMessage: Message;
    page: Promise<number | undefined>;
}>;
export {};
