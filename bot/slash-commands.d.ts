/// <reference types="node" />
import type { AutocompleteInteraction, CommandInteraction, ContextMenuInteraction, GuildResolvable } from "discord.js";
import type { AutocompleteParams, SlashCommandHandler, SlashCommandLocation } from "../types/types-bot.js";
import type { CommandOptionsMap, StrictCommand, SubCommandGroupsOf, SubCommandsOf } from "../types/the-option-understander-has-signed-on.js";
export declare function registerCommandsOnConnect(): Promise<void>;
export declare function addSlashCommand<Config extends StrictCommand>({ where, config, handler, ephemeral, deferImmediately, failIfLong, autocompleters, }: {
    where: SlashCommandLocation;
    config: Config;
    handler: SlashCommandHandler<CommandOptionsMap<Config>, SubCommandsOf<Config>, SubCommandGroupsOf<Config>>;
    ephemeral?: boolean;
    deferImmediately?: boolean;
    failIfLong?: boolean;
    autocompleters?: NodeJS.Dict<(params: AutocompleteParams) => string[] | {
        name: string;
        value: string | number;
    }[]>;
}): void;
export declare function routeAutocomplete(interaction: AutocompleteInteraction): Promise<never[] | undefined>;
export declare function routeContextMenuCommand(interaction: ContextMenuInteraction): Promise<void>;
export declare function routeSlashCommand(interaction: CommandInteraction): Promise<void>;
/** allow only these users to use this command, in this guild */
export declare function setPermittedCommandUserInGuild(commandName: string, guildId: GuildResolvable, userIds: string | string[], strict?: boolean): Promise<void>;
/** allow only these users to use this command, in all guilds where it's present */
export declare function setPermittedCommandUserEverywhere(commandName: string, userIds: string | string[]): Promise<void>;
