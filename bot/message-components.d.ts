/// <reference types="node" />
import { ActionRow, ButtonStyle, Embed, Guild, InteractionReplyOptions, MessageComponentInteraction, TextBasedChannel, User } from "discord.js";
import { Sendable } from "../types/types-bot.js";
import { Message } from "discord.js";
import { Awaitable } from "one-stone/types";
import { ComponentParams } from "./component-id-parser.js";
import { APIMessageComponentEmoji, APISelectMenuOption } from "discord-api-types";
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
    }) => Awaitable<InteractionReplyOptions | Embed | string | undefined | void>);
    ephemeral?: boolean;
    deferImmediately?: boolean;
    allowTimeout?: boolean;
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
} & ComponentInteractionHandlingData): ActionRow<import("@discordjs/builders").ActionRowComponent>[];
export declare function createComponentSelects({ interactionID, selects, ...handlingData }: {
    selects: InteractionSelect | InteractionSelect[];
    interactionID: string;
} & ComponentInteractionHandlingData): ActionRow<import("@discordjs/builders").ActionRowComponent>[];
export declare function routeComponentInteraction(interaction: MessageComponentInteraction): Promise<void>;
export {};
