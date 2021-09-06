import { MessageActionRow, MessageEmbed } from "discord.js";
export declare function createPaginator({ id, getPageData, }: {
    id: string;
    getPageData: (pageNum: number) => [requestedPage: MessageEmbed, totalPages: number];
}): {
    embeds: MessageEmbed[];
    components: MessageActionRow[];
};
