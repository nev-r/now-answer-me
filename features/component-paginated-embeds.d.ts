import { APISelectMenuOption, ActionRowBuilder, MessageActionRowComponentBuilder, EmbedBuilder, SelectMenuComponentOptionData } from "discord.js";
import { Awaitable } from "one-stone/types";
import { Sendable } from "../types/types-discord.js";
export declare function createPaginator({ paginatorName, getPageData, }: {
    paginatorName: string;
    getPageData: (pageNum: number, seed?: string) => [requestedPage: EmbedBuilder, totalPages: number];
}): (seed?: string | undefined) => {
    embeds: EmbedBuilder[];
    components: ActionRowBuilder<MessageActionRowComponentBuilder>[];
};
export declare function createPaginatedSelector({ paginatorName, getPageData, finalizer, }: {
    paginatorName: string;
    getPageData: (pageNum: number, seed?: string) => [
        requestedPage: EmbedBuilder,
        totalPages: number,
        selectorOptions: (APISelectMenuOption | SelectMenuComponentOptionData)[]
    ];
    finalizer: (selectionNumber: string, seed?: string) => Awaitable<Sendable>;
}): (seed?: string | undefined) => {
    embeds: EmbedBuilder[];
    components: ActionRowBuilder<MessageActionRowComponentBuilder>[];
};
