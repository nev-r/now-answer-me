/// <reference types="node" />
import { AutocompleteInteraction, ChatInputApplicationCommandData, CommandInteraction, ContextMenuCommandInteraction, EmbedBuilder, Message } from "discord.js";
import type { AutocompleteParams, Sendable, SlashCommandLocation } from "../types/types-bot.js";
import { ModalBuilder } from "@discordjs/builders";
import { Awaitable } from "one-stone/types";
export declare function registerCommandsOnConnect(): Promise<void>;
export declare function addSlashCommand({ where, config, handler, ephemeral, deferImmediately, failIfLong, autocompleters, }: {
    /** where to register this: 'global' (even in DMs), 'all' (in each server individually), or a server id or list of server ids */
    where: SlashCommandLocation;
    config: ChatInputApplicationCommandData;
    handler: ((params: {
        /** the guild where this command was triggered */
        guild: Message["guild"];
        /** the user who triggered this command */
        user: Message["author"];
        channel: CommandInteraction["channel"];
        optionList: [string, any][];
        optionDict: Record<string, any>;
        subCommand: string | undefined;
        subCommandGroup: string | undefined;
    }) => Awaitable<Sendable | EmbedBuilder | ModalBuilder | string | undefined | void>) | Sendable;
    ephemeral?: boolean;
    deferImmediately?: boolean;
    failIfLong?: boolean;
    autocompleters?: NodeJS.Dict<(params: AutocompleteParams) => Awaitable<string[] | {
        name: string;
        value: string | number;
    }[]>>;
}): void;
export declare function routeAutocomplete(interaction: AutocompleteInteraction): Promise<never[] | undefined>;
export declare function routeContextMenuCommand(interaction: ContextMenuCommandInteraction): Promise<void>;
export declare function routeSlashCommand(interaction: CommandInteraction): Promise<void>;
