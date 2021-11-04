import { InteractionReplyOptions, MessageActionRow, MessageEmbed, MessageSelectOptionData } from "discord.js";
import { Awaitable } from "one-stone/types";
export declare function createPaginator({ paginatorName, getPageData, }: {
    paginatorName: string;
    getPageData: (pageNum: number, seed?: string) => [requestedPage: MessageEmbed, totalPages: number];
}): (seed?: string | undefined) => {
    embeds: MessageEmbed[];
    components: MessageActionRow[];
};
export declare function createPaginatedSelector({ paginatorName, getPageData, finalizer, }: {
    paginatorName: string;
    getPageData: (pageNum: number, seed?: string) => [
        requestedPage: MessageEmbed,
        totalPages: number,
        selectorOptions: MessageSelectOptionData[]
    ];
    finalizer: (selectionNumber: string, seed?: string) => Awaitable<InteractionReplyOptions | MessageEmbed>;
}): (seed?: string | undefined) => {
    embeds: MessageEmbed[];
    components: MessageActionRow[];
};
