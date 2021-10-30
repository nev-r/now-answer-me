import type { AutocompleteInteraction, CommandInteraction, ContextMenuInteraction, GuildResolvable } from "discord.js";
import type { SlashCommandResponse } from "../types/types-bot.js";
import type { CommandOptionsMap, StrictCommand, SubCommandGroupsOf, SubCommandsOf } from "../types/the-option-understander-has-signed-on.js";
export declare const theseStillNeedRegistering: string[];
export declare function registerCommandsOnConnect(): Promise<void>;
export declare function addSlashCommand<Config extends StrictCommand>({ where, config, handler, ephemeral, deferImmediately, failIfLong, }: {
    where: "global" | GuildResolvable | ("global" | GuildResolvable)[];
    config: Config;
    handler: SlashCommandResponse<CommandOptionsMap<Config>, SubCommandsOf<Config>, SubCommandGroupsOf<Config>>;
    ephemeral?: boolean;
    deferImmediately?: boolean;
    failIfLong?: boolean;
}): void;
export declare function routeAutocomplete(interaction: AutocompleteInteraction): Promise<void>;
export declare function routeContextMenuCommand(interaction: ContextMenuInteraction): Promise<void>;
export declare function routeSlashCommand(interaction: CommandInteraction): Promise<void>;
