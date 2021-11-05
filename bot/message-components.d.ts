/// <reference types="node" />
import { EmojiIdentifierResolvable, Guild, InteractionReplyOptions, MessageActionRow, MessageButtonStyleResolvable, MessageComponentInteraction, MessageEmbed, MessageSelectOptionData, TextBasedChannels, User } from "discord.js";
import { Sendable } from "../types/types-bot.js";
import { Message } from "discord.js";
import { Awaitable } from "one-stone/types";
import { MessageButtonStyles } from "discord.js/typings/enums";
import { ComponentParams } from "./component-id-parser.js";
export declare const wastebasket: string;
export declare const lock: string;
export declare type ComponentInteractionHandlingData = {
    handler: Sendable | ((_: {
        guild: Guild | null;
        channel: TextBasedChannels | null;
        user: User;
        message?: Message;
        interactionID: string;
        componentParams: ComponentParams;
        values?: string[];
    }) => Awaitable<InteractionReplyOptions | MessageEmbed | string | undefined | void>);
    ephemeral?: boolean;
    deferImmediately?: boolean;
    allowTimeout?: boolean;
    update?: boolean;
    public?: boolean;
};
export declare const componentInteractions: NodeJS.Dict<ComponentInteractionHandlingData>;
declare type InteractionButton = {
    disabled?: boolean;
    style: Exclude<MessageButtonStyleResolvable, "LINK" | MessageButtonStyles.LINK>;
    value: string;
} & ({
    emoji: EmojiIdentifierResolvable;
    label: string;
} | {
    emoji?: undefined;
    label: string;
} | {
    emoji: EmojiIdentifierResolvable;
    label?: undefined;
});
declare type InteractionSelect = {
    controlID: string;
    disabled?: boolean;
    maxValues?: number;
    minValues?: number;
    options: MessageSelectOptionData[];
    placeholder?: string;
};
export declare function createComponentButtons({ interactionID, buttons, ...handlingData }: {
    buttons: InteractionButton | InteractionButton[] | InteractionButton[][];
    interactionID: string;
} & ComponentInteractionHandlingData): MessageActionRow[];
export declare function createComponentSelects({ interactionID, selects, ...handlingData }: {
    selects: InteractionSelect | InteractionSelect[];
    interactionID: string;
} & ComponentInteractionHandlingData): MessageActionRow[];
export declare function routeComponentInteraction(interaction: MessageComponentInteraction): Promise<void>;
export {};
