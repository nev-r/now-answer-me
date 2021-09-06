/// <reference types="node" />
import { EmojiIdentifierResolvable, Guild, InteractionReplyOptions, MessageActionRow, MessageButtonStyleResolvable, MessageComponentInteraction, MessageEmbed, MessageSelectOptionData, TextBasedChannels, User } from "discord.js";
import { Sendable } from "../types/types-bot.js";
import { Awaitable } from "one-stone/types";
import { MessageButtonStyles } from "discord.js/typings/enums";
export declare type ComponentInteractionHandlingData = {
    handler: Sendable | ((_: {
        guild: Guild | null;
        channel: TextBasedChannels | null;
        user: User;
        interactionID: string;
        controlID: string;
        values?: string[];
    }) => Awaitable<InteractionReplyOptions | MessageEmbed | string | undefined | void>);
    ephemeral?: boolean;
    deferImmediately?: boolean;
    deferIfLong?: boolean;
    update?: boolean;
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
