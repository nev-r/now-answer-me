import { EmojiIdentifierResolvable, Guild, InteractionReplyOptions, MessageActionRow, MessageButtonStyleResolvable, MessageComponentInteraction, MessageEmbed, TextBasedChannels, User } from "discord.js";
import { Sendable } from "../types/types-bot.js";
import { Awaitable } from "one-stone/types";
import { MessageButtonStyles } from "discord.js/typings/enums";
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
    buttons: {
        disabled?: boolean;
        emoji?: EmojiIdentifierResolvable;
        label: string;
        style: Exclude<MessageButtonStyleResolvable, "LINK" | MessageButtonStyles.LINK>;
        value: string;
    }[];
    interactionID: string;
} & ComponentInteractionHandlingData): MessageActionRow;
export declare function routeComponentInteraction(interaction: MessageComponentInteraction): Promise<void>;
export {};
