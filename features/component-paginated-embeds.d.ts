import { APISelectMenuOption } from "discord-api-types";
import { InteractionReplyOptions, ActionRow, Embed } from "discord.js";
import { Awaitable } from "one-stone/types";
export declare function createPaginator({ paginatorName, getPageData, }: {
    paginatorName: string;
    getPageData: (pageNum: number, seed?: string) => [requestedPage: Embed, totalPages: number];
}): (seed?: string | undefined) => {
    embeds: Embed[];
    components: ActionRow<import("@discordjs/builders").ActionRowComponent>[];
};
export declare function createPaginatedSelector({ paginatorName, getPageData, finalizer, }: {
    paginatorName: string;
    getPageData: (pageNum: number, seed?: string) => [requestedPage: Embed, totalPages: number, selectorOptions: APISelectMenuOption[]];
    finalizer: (selectionNumber: string, seed?: string) => Awaitable<InteractionReplyOptions | Embed>;
}): (seed?: string | undefined) => {
    embeds: Embed[];
    components: ActionRow<import("@discordjs/builders").ActionRowComponent>[];
};
