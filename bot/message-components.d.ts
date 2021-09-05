import { Guild, InteractionReplyOptions, MessageActionRow, MessageButtonOptions, MessageComponentInteraction, MessageEmbed, TextBasedChannels, User } from "discord.js";
import { Sendable } from "../types/types-bot.js";
import { Awaitable } from "one-stone/types";
declare type ComponentInteractionHandlingData = {
    handler: Sendable | (({ guild, channel, user, interactionID, controlID, }: {
        guild: Guild | null;
        channel: TextBasedChannels | null;
        user: User;
        interactionID: string;
        controlID: string;
    }) => Awaitable<InteractionReplyOptions | MessageEmbed | string | undefined | void>);
    ephemeral?: boolean;
    deferImmediately?: boolean;
    deferIfLong?: boolean;
};
export declare function createComponentInteraction({ interactionID, buttons, ...handlingData }: {
    buttons: MessageButtonOptions[] | MessageButtonOptions;
    interactionID: string;
} & ComponentInteractionHandlingData): MessageActionRow;
export declare function routeComponentInteraction(interaction: MessageComponentInteraction): Promise<void>;
export {};
