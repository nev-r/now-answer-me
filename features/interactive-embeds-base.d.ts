import type { Message, User, EmbedFieldData, TextBasedChannel } from "discord.js";
import { Embed } from "discord.js";
declare const reactOptions: {
    arrows: ("⬅️" | "➡️")[];
    random: "🎲"[];
    arrowsRandom: ("⬅️" | "➡️" | "🎲")[];
};
export declare function _newPaginatedSelector_<T>({ user, preexistingMessage, channel, cleanupReactions, optionRenderer, selectables, startPage, buttons, prompt, itemsPerPage, waitTime, }: {
    user?: User;
    preexistingMessage?: Message;
    channel?: TextBasedChannel;
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
    channel?: TextBasedChannel;
    pages: any[];
    renderer?: (sourceData: any) => Embed | Promise<Embed>;
    startPage?: number;
    buttons?: keyof typeof reactOptions;
    waitTime?: number;
}): Promise<{
    paginatedMessage: Message<boolean>;
    page: Promise<number | undefined>;
}>;
export {};
