/// <reference types="node" />
import { AutocompleteInteraction, CommandInteraction, ContextMenuCommandInteraction, EmbedBuilder, GuildResolvable, Message } from "discord.js";
import type { AutocompleteParams, Sendable, SlashCommandLocation } from "../types/types-bot.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Awaitable } from "one-stone/types";
export declare function registerCommandsOnConnect(): Promise<void>;
export declare function addSlashCommand({ where, config, handler, ephemeral, deferImmediately, failIfLong, autocompleters, }: {
    /** where to register this: 'global' (even in DMs), 'all' (in each server individually), or a server id or list of server ids */
    where: SlashCommandLocation;
    config: SlashCommandBuilder;
    handler: ((params: {
        /** the guild where this command was triggered */
        guild: Message["guild"];
        /** the user who triggered this command */
        user: Message["author"];
        channel: CommandInteraction["channel"];
        optionList: [string, number][];
        optionDict: Record<string, number>;
        subCommand: string | undefined;
        subCommandGroup: string | undefined;
    }) => Awaitable<Sendable | EmbedBuilder | string | undefined | void>) | Sendable;
    ephemeral?: boolean;
    deferImmediately?: boolean;
    failIfLong?: boolean;
    autocompleters?: NodeJS.Dict<(params: AutocompleteParams) => string[] | {
        name: string;
        value: string | number;
    }[]>;
}): void;
export declare function routeAutocomplete(interaction: AutocompleteInteraction): Promise<never[] | undefined>;
export declare function routeContextMenuCommand(interaction: ContextMenuCommandInteraction): Promise<void>;
export declare function routeSlashCommand(interaction: CommandInteraction): Promise<void>;
/** allow only these users to use this command, in this guild */
export declare function setPermittedCommandUserInGuild(commandName: string, guildId: GuildResolvable, userIds: string | string[], strict?: boolean): Promise<void>;
/** allow only these users to use this command, in all guilds where it's present */
export declare function setPermittedCommandUserEverywhere(commandName: string, userIds: string | string[]): Promise<void>;
