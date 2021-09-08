import { MessageActionRow, MessageEmbed, MessageSelectOptionData } from "discord.js";
export declare function generateInitialPagination(paginatorName: string, seed?: string): {
    embeds: MessageEmbed[];
    components: MessageActionRow[];
};
export declare function generateInitialPaginatedSelector(paginatorName: string, seed?: string): {
    embeds: MessageEmbed[];
    components: MessageActionRow[];
};
export declare function registerPaginator({ paginatorName, getPageData, }: {
    paginatorName: string;
    getPageData: (pageNum: number, seed?: string) => [requestedPage: MessageEmbed, totalPages: number];
}): void;
export declare function registerPaginatedSelector({ paginatorName, getPageData, finalizer, }: {
    paginatorName: string;
    getPageData: (pageNum: number, seed?: string) => [
        requestedPage: MessageEmbed,
        totalPages: number,
        selectorOptions: MessageSelectOptionData[]
    ];
    finalizer: (selectionNumber: string, seed?: string) => MessageEmbed;
}): void;
