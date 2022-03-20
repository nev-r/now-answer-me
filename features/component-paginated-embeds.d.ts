import { ActionRowBuilder, MessageActionRowComponentBuilder } from "@discordjs/builders";
import { Embed, APISelectMenuOption } from "discord.js";
import { Awaitable } from "one-stone/types";
import { Sendable } from "../types/types-discord.js";
export declare function createPaginator({ paginatorName, getPageData, }: {
    paginatorName: string;
    getPageData: (pageNum: number, seed?: string) => [requestedPage: Embed, totalPages: number];
}): (seed?: string | undefined) => {
    embeds: Embed[];
    components: ActionRowBuilder<MessageActionRowComponentBuilder>[];
};
export declare function createPaginatedSelector({ paginatorName, getPageData, finalizer, }: {
    paginatorName: string;
    getPageData: (pageNum: number, seed?: string) => [requestedPage: Embed, totalPages: number, selectorOptions: APISelectMenuOption[]];
    finalizer: (selectionNumber: string, seed?: string) => Awaitable<Sendable>;
}): (seed?: string | undefined) => {
    embeds: Embed[];
    components: ActionRowBuilder<MessageActionRowComponentBuilder>[];
};
