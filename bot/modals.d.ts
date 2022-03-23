/// <reference types="node" />
import { Guild, ModalBuilder, ModalSubmitInteraction, TextBasedChannel, User } from "discord.js";
import { Sendable } from "../types/types-bot.js";
import { Awaitable } from "one-stone/types";
export declare type ModalHandlingData = {
    handler: Sendable | ((_: {
        guild: Guild | null;
        channel: TextBasedChannel | null;
        user: User;
        textFields: NodeJS.Dict<string>;
    }) => Awaitable<Sendable | undefined | void>);
    ephemeral?: boolean;
    deferImmediately?: boolean;
    allowTimeout?: boolean;
};
export declare const modalHandlers: NodeJS.Dict<ModalHandlingData>;
export declare function registerModal({ interactionID, modal, ...handlingData }: {
    modal: ModalBuilder;
    interactionID: string;
} & ModalHandlingData): ModalBuilder;
export declare function routeModalSubmit(interaction: ModalSubmitInteraction): Promise<void>;
