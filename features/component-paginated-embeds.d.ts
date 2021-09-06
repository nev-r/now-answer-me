import { MessageActionRow, MessageEmbed } from "discord.js";
export declare function registerPaginator({ paginatorName, getPageData, }: {
    paginatorName: string;
    getPageData: (pageNum: number, arg: string) => [requestedPage: MessageEmbed, totalPages: number];
}): void;
export declare function generateInitialPagination(paginatorName: string, arg: string): {
    embeds: MessageEmbed[];
    components: MessageActionRow[];
};
