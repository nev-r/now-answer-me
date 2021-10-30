import type { Message, User, EmbedFieldData, TextBasedChannels } from "discord.js";
import { MessageEmbed } from "discord.js";
declare const reactOptions: {
    arrows: ("⬅️" | "➡️")[];
    random: "🎲"[];
    arrowsRandom: ("⬅️" | "➡️" | "🎲")[];
};
export declare function _newPaginatedSelector_<T>({ user, preexistingMessage, channel, cleanupReactions, optionRenderer, selectables, startPage, buttons, prompt, itemsPerPage, waitTime, }: {
    user?: User;
    preexistingMessage?: Message;
    channel?: TextBasedChannels;
    cleanupReactions?: boolean;
    optionRenderer?: (listItem: any, index: number) => EmbedFieldData;
    selectables: (T | EmbedFieldData)[];
    startPage?: number;
    buttons?: keyof typeof reactOptions;
    prompt?: string;
    itemsPerPage?: number;
    waitTime?: number;
}): Promise<{
    paginatedMessage: Message<boolean>;
    selection: Promise<number | undefined>;
}>;
export declare function _newPaginatedEmbed_({ user, preexistingMessage, channel, pages, renderer, startPage, buttons, waitTime, }: {
    user?: User;
    preexistingMessage?: Message;
    channel?: TextBasedChannels;
    pages: any[];
    renderer?: (sourceData: any) => MessageEmbed | Promise<MessageEmbed>;
    startPage?: number;
    buttons?: keyof typeof reactOptions;
    waitTime?: number;
}): Promise<{
    paginatedMessage: Message<boolean>;
    page: Promise<number | undefined>;
}>;
export {};
