import {
	ApplicationCommandData,
	ApplicationCommandOption,
	ApplicationCommandOptionChoice,
	ApplicationCommandOptionData,
	CommandInteraction,
	CommandInteractionOption,
	GuildResolvable,
	MessageComponentInteraction,
} from "discord.js";
import { Message } from "discord.js";
import type { Sendable, SlashCommandResponse } from "../types/types-bot.js";
import { sendableToMessageOptions } from "../utils/misc.js";
import { arrayify } from "one-stone/array";
import { CommandOptions, StrictCommand } from "../types/the-option-understander-has-signed-on.js";
import { escMarkdown } from "one-stone/string";
import { client, clientReady, clientStatus } from "./index.js";

const slashCommands: NodeJS.Dict<
	{
		where: "global" | GuildResolvable;
		config: ApplicationCommandDataNoEnums;
		handler: SlashCommandResponse<any>;
		ephemeral?: boolean;
		defer?: boolean;
		deferIfLong?: boolean;
	}
> = {};
export const needRegistering: string[] = [];

export async function registerCommandsOnConnect() {
	while (needRegistering.length) {
		const nameToRegister = needRegistering.pop();
		if (nameToRegister) {
			const toRegister = slashCommands[nameToRegister];
			if (toRegister) {
				await registerSlashCommands(toRegister.where, [toRegister.config]);
			}
		}
	}
}

export function addSlashCommand<Config extends StrictCommand>({
	where,
	config,
	handler,
	ephemeral,
	defer,
	deferIfLong,
}: {
	where: "global" | GuildResolvable;
	config: Config;
	handler: SlashCommandResponse<CommandOptions<Config>>;
	ephemeral?: boolean;
	defer?: boolean;
	deferIfLong?: boolean;
}) {
	const standardConfig = standardizeConfig(config);
	if (clientStatus.hasConnected) registerSlashCommands(where, [standardConfig]);
	else needRegistering.push(config.name);
	slashCommands[config.name] = {
		where,
		config: standardConfig,
		handler,
		ephemeral,
		defer,
		deferIfLong,
	};
}

// given a command string, find and run the appropriate function
export async function routeSlashCommand(interaction: CommandInteraction) {
	const slashCommand = slashCommands[interaction.commandName];
	if (!slashCommand) {
		console.log(`unrecognized slash command received: ${interaction.commandName}`);
		return;
	}

	let { handler, ephemeral, defer, deferIfLong } = slashCommand;
	let deferalCountdown: undefined | NodeJS.Timeout;
	if (defer || deferIfLong) {
		deferalCountdown = setTimeout(
			() => {
				interaction.defer({ ephemeral });
			},
			defer ? 0 : 2300
		);
	}
	try {
		let results: Sendable | Message | undefined;
		if (typeof handler === "function") {
			const { guild, channel, user } = interaction;
			const {optionDict,subCommand,subCommandGroup} = createDictFromOptions([...interaction.options.values()]);
			const optionList = Object.entries(optionDict);

			results =
				(await handler({
					channel,
					guild,
					user,
					optionList,
					optionDict,subCommand,subCommandGroup
				})) || "";
		} else {
			results = handler;
		}
		deferalCountdown && clearTimeout(deferalCountdown);
		if (results && !interaction.replied) {
			await interaction.reply({ ...sendableToMessageOptions(results), ephemeral });
		}
	} catch (e) {
		await interaction.reply({ content: "⚠", ephemeral: true });
		console.log(e);
	}
	if (!interaction.replied) await interaction.reply({ content: "☑", ephemeral: true });
}

async function registerSlashCommands(
	where: "global" | GuildResolvable,
	config: ApplicationCommandDataNoEnums[]
) {
	const configs = arrayify(config);
	await clientReady;
	const destination = where === "global" ? client.application : client.guilds.resolve(where);
	if (!destination) throw `couldn't resolve ${where} to a guild`;

	if (!destination.commands.cache.size) await destination.commands.fetch();
	const cache = [...destination.commands.cache.values()];

	for (const conf of configs.map(standardizeConfig)) {
		const matchingConfig = cache.find((c) => {
			return c.name === conf.name && configDoesMatch(c, conf);
		});
		console.log(
			`registering ${conf.name}: ${
				matchingConfig ? "already exists" : (await destination.commands.create(conf)) && "done!"
			}`
		);
		// console.log({ ...matchingConfig, guild: undefined, permissions: undefined });
	}
}

function createDictFromOptions(
	originalOptions: CommandInteractionOption[],
	meta: {
		subCommandGroup?: string;
		subCommand?: string;
		optionDict: any;
	} = {
		subCommandGroup: undefined,
		subCommand: undefined,
		optionDict: {},
	}
) {
	for (const opt of originalOptions) {
		if (opt.type === "SUB_COMMAND" || opt.type === "SUB_COMMAND_GROUP") {
			if (opt.type === "SUB_COMMAND") meta.subCommand = opt.name;
			if (opt.type === "SUB_COMMAND_GROUP") meta.subCommandGroup = opt.name;
			meta.optionDict[opt.name] = createDictFromOptions(
				opt.options ? [...opt.options.values()] : []
			);
		} else {
			meta.optionDict[opt.name] =
				opt.type === "CHANNEL"
					? opt.channel
					: opt.type === "USER"
					? opt.member ?? opt.user
					: opt.type === "ROLE"
					? opt.role
					: opt.type === "MENTIONABLE"
					? undefined
					: opt.value;
		}
	}
	return meta;
}

type ApplicationCommandDataNoEnums = Pick<
	ApplicationCommandData,
	"defaultPermission" | "description" | "name"
> & { options?: ApplicationCommandOption[] };

function configDoesMatch(
	conf1: ApplicationCommandDataNoEnums,
	conf2: ApplicationCommandDataNoEnums
) {
	return (
		conf1.name === conf2.name &&
		conf1.description === conf2.description &&
		conf1.defaultPermission === conf2.defaultPermission &&
		allOptionsDoMatch(conf1.options, conf2.options)
	);
}

function allOptionsDoMatch(
	options1?: ApplicationCommandOption[],
	options2?: ApplicationCommandOption[]
) {
	return Boolean(
		options1 === options2 ||
			(options1 &&
				options2 &&
				[...options1.keys()].every((k) => optionDoesMatch(options1[k], options2[k])))
	);
}

function optionDoesMatch(
	option1: ApplicationCommandOption,
	option2: ApplicationCommandOption
): boolean {
	return (
		option1.name === option2.name &&
		option1.description === option2.description &&
		option1.required === option2.required &&
		option1.type === option2.type &&
		(option1.options === option2.options ||
			(!option1.options?.length && !option2.options?.length) ||
			allOptionsDoMatch(option1.options ?? [], option2.options ?? []))
	);
}

function standardizeConfig({
	name,
	description,
	defaultPermission = true,
	options = [],
}: StrictCommand | ApplicationCommandData): ApplicationCommandDataNoEnums {
	return { name, description, defaultPermission, options: options.map(standardizeOption) };
}

const enumToString = [
	null,
	"SUB_COMMAND",
	"SUB_COMMAND_GROUP",
	"STRING",
	"INTEGER",
	"BOOLEAN",
	"USER",
	"CHANNEL",
	"ROLE",
	"MENTIONABLE",
] as const;

function standardizeOption<
	D extends NonNullable<StrictCommand["options"]>[number] | ApplicationCommandOptionData
>({
	type,
	name,
	description,
	required,
	choices, //
	options,
}: D): ApplicationCommandOption {
	type = typeof type === "string" ? type : (enumToString[type] as ApplicationCommandOption["type"]);
	return {
		type,
		name,
		description,
		required,
		choices: choices as ApplicationCommandOptionChoice[],
		options: options?.map(standardizeOption),
	};
}
