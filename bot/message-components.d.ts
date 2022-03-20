/// <reference types="node" />
import { ActionRowBuilder, APISelectMenuOption, ButtonStyle, Guild, MessageActionRowComponentBuilder, MessageComponentInteraction, TextBasedChannel, User } from "discord.js";
import { Sendable } from "../types/types-bot.js";
import { Message } from "discord.js";
import { Awaitable } from "one-stone/types";
import { ComponentParams } from "./component-id-parser.js";
import { APIMessageComponentEmoji } from "discord.js/node_modules/discord-api-types/v9";
export declare const wastebasket: string;
export declare const wastebasketEmoji: {
    name: string;
};
export declare const lock: string;
export declare const lockEmoji: {
    name: string;
};
export declare type ComponentInteractionHandlingData = {
    handler: Sendable | ((_: {
        guild: Guild | null;
        channel: TextBasedChannel | null;
        user: User;
        message?: Message;
        interactionID: string;
        componentParams: ComponentParams;
        values?: string[];
    }) => Awaitable<Sendable | undefined | void>);
    ephemeral?: boolean;
    deferImmediately?: boolean;
    allowTimeout?: boolean;
    /** send this reponse by updating the interacted message, instead of creating a new message */
    update?: boolean;
    public?: boolean;
};
export declare const componentInteractions: NodeJS.Dict<ComponentInteractionHandlingData>;
declare type InteractionButton = {
    disabled?: boolean;
    style: Exclude<ButtonStyle, "LINK" | ButtonStyle.Link>;
    value: string;
} & ({
    emoji: APIMessageComponentEmoji;
    label: string;
} | {
    emoji?: undefined;
    label: string;
} | {
    emoji: APIMessageComponentEmoji;
    label?: undefined;
});
declare type InteractionSelect = {
    controlID: string;
    disabled?: boolean;
    maxValues?: number;
    minValues?: number;
    options: APISelectMenuOption[];
    placeholder?: string;
};
export declare function createComponentButtons({ interactionID, buttons, ...handlingData }: {
    buttons: InteractionButton | InteractionButton[] | InteractionButton[][];
    interactionID: string;
} & ComponentInteractionHandlingData): ActionRowBuilder[];
export declare function createComponentSelects({ interactionID, selects, ...handlingData }: {
    selects: InteractionSelect | InteractionSelect[];
    interactionID: string;
} & ComponentInteractionHandlingData): ActionRowBuilder<MessageActionRowComponentBuilder>[];
export declare function routeComponentInteraction(interaction: MessageComponentInteraction): Promise<void>;
export {};
