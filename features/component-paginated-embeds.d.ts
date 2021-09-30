import { InteractionReplyOptions, MessageActionRow, MessageEmbed, MessageSelectOptionData } from "discord.js";
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
    finalizer: (selectionNumber: string, seed?: string) => InteractionReplyOptions | MessageEmbed;
}): (seed?: string | undefined) => {
    embeds: MessageEmbed[];
    components: MessageActionRow[];
};
