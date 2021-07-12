import { CommandInteraction, GuildResolvable } from "discord.js";
import type { SlashCommandResponse } from "../types/types-bot.js";
import { CommandOptions, StrictCommand } from "../types/the-option-understander-has-signed-on.js";
export declare const needRegistering: string[];
export declare function registerCommandsOnConnect(): Promise<void>;
export declare function addSlashCommand<Config extends StrictCommand>({ where, config, handler, ephemeral, defer, deferIfLong, }: {
    where: "global" | GuildResolvable;
    config: Config;
    handler: SlashCommandResponse<CommandOptions<Config>>;
    ephemeral?: boolean;
    defer?: boolean;
    deferIfLong?: boolean;
}): void;
export declare function routeSlashCommand(interaction: CommandInteraction): Promise<void>;
