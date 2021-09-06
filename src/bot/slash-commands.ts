import {
	ApplicationCommandData,
	ApplicationCommandOption,
	ApplicationCommandOptionChoice,
	ApplicationCommandOptionData,
	ChatInputApplicationCommandData,
	CommandInteraction,
	CommandInteractionOption,
	GuildResolvable,
} from "discord.js";
import { APIApplicationCommandOption } from "discord-api-types/v9";
import { Message } from "discord.js";
import type { Sendable, SlashCommandResponse } from "../types/types-bot.js";
import { sendableToInteractionReplyOptions, sendableToMessageOptions } from "../utils/misc.js";
import { arrayify } from "one-stone/array";
import {
	CommandOptionsMap,
	StrictCommand,
	StrictOption,
	SubCommandGroupsOf,
	SubCommandsOf,
} from "../types/the-option-understander-has-signed-on.js";
import { client, clientReady, clientStatus } from "./index.js";

const slashCommands: NodeJS.Dict<{
	where: "global" | GuildResolvable | ("global" | GuildResolvable)[];
	config: ChatInputApplicationCommandData;
	handler: SlashCommandResponse<any, any, any>;
	ephemeral?: boolean;
	deferImmediately?: boolean;
	deferIfLong?: boolean;
}> = {};
export const theseStillNeedRegistering: string[] = [];

export async function registerCommandsOnConnect() {
	while (theseStillNeedRegistering.length) {
		const nameToRegister = theseStillNeedRegistering.pop();
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
	deferImmediately,
	deferIfLong,
}: {
	where: "global" | GuildResolvable | ("global" | GuildResolvable)[];
	config: Config;
	handler: SlashCommandResponse<
		CommandOptionsMap<Config>,
		SubCommandsOf<Config>,
		SubCommandGroupsOf<Config>
	>;
	ephemeral?: boolean;
	deferImmediately?: boolean;
	deferIfLong?: boolean;
}) {
	const standardConfig = unConst(config);
	slashCommands[config.name] = {
		where,
		config: standardConfig,
		handler,
		ephemeral,
		deferImmediately,
		deferIfLong,
	};

	if (clientStatus.hasConnected) registerSlashCommands(where, [standardConfig]);
	else theseStillNeedRegistering.push(config.name);
}

// given a command string, find and run the appropriate function
export async function routeSlashCommand(interaction: CommandInteraction) {
	const slashCommand = slashCommands[interaction.commandName];
	if (!slashCommand) {
		console.log(`unrecognized slash command received: ${interaction.commandName}`);
		return;
	}

	let { handler, ephemeral, deferImmediately, deferIfLong } = slashCommand;
	let deferalCountdown: undefined | NodeJS.Timeout;
	if (deferImmediately || deferIfLong) {
		deferalCountdown = setTimeout(
			() => interaction.deferReply({ ephemeral }),
			deferImmediately ? 0 : 2300
		);
	}
	try {
		let results: Sendable | Message | undefined;
		if (typeof handler === "function") {
			const { guild, channel, user } = interaction;
			const { optionDict, subCommand, subCommandGroup } = createDictFromSelectedOptions([
				...interaction.options.data,
			]);
			const optionList = Object.entries(optionDict);

			results =
				(await handler({
					channel,
					guild,
					user,
					optionList,
					optionDict,
					subCommand,
					subCommandGroup,
				})) || "";
		} else {
			results = handler;
		}
		deferalCountdown && clearTimeout(deferalCountdown);
		if (results && !interaction.replied) {
			await interaction.reply({ ephemeral, ...sendableToInteractionReplyOptions(results) });
		}
	} catch (e) {
		await interaction.reply({ content: "⚠", ephemeral: true });
		console.log(e);
	}
	if (!interaction.replied) await interaction.reply({ content: "☑", ephemeral: true });
}

async function registerSlashCommands(
	whereOrWheres: "global" | GuildResolvable | GuildResolvable[],
	config: ChatInputApplicationCommandData | ChatInputApplicationCommandData[]
) {
	const wheres = arrayify(whereOrWheres);
	const configs = arrayify(config);
	await clientReady;

	for (const where of wheres) {
		const destination = where === "global" ? client.application : client.guilds.resolve(where);
		if (!destination) throw `couldn't resolve ${where} to a guild`;

		if (!destination.commands.cache.size) await (destination as any).commands.fetch();
		const cache = [...destination.commands.cache.values()];

		for (const conf of configs) {
			process.stdout.write(`registering ${conf.name}: `);
			const matchingConfig = cache.find((c) => {
				return c.equals(conf);
			});
			if (matchingConfig) console.log("already set up");
			else
				try {
					await destination.commands.create(conf);
					console.log("done");
				} catch (e) {
					console.log("failed..");
					console.log(e);
				}
		}
	}
}

function createDictFromSelectedOptions(
	originalOptions: CommandInteractionOption[],
	meta: {
		subCommandGroup?: string;
		subCommand?: string;
	} = {
		subCommandGroup: undefined,
		subCommand: undefined,
	}
) {
	const optionDict: NodeJS.Dict<any> = {};
	for (const opt of originalOptions) {
		if (opt.type === "SUB_COMMAND" || opt.type === "SUB_COMMAND_GROUP") {
			if (opt.type === "SUB_COMMAND") meta.subCommand = opt.name;
			if (opt.type === "SUB_COMMAND_GROUP") meta.subCommandGroup = opt.name;
			optionDict[opt.name] = createDictFromSelectedOptions(
				opt.options ? [...opt.options.values()] : [],
				meta
			).optionDict;
		} else {
			optionDict[opt.name] =
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
	return { ...meta, optionDict };
}

// type ApplicationCommandDataNoEnums = Pick<
// 	ChatInputApplicationCommandData,
// 	"defaultPermission" | "description" | "name" | "type"
// > & { options?: ApplicationCommandOption[] };

// function configDoesMatch( 	conf1: ApplicationCommandDataNoEnums, 	conf2: ApplicationCommandDataNoEnums ) { 	return ( 		conf1.name === conf2.name && 		conf1.description === conf2.description && 		(conf1.defaultPermission ?? true === conf2.defaultPermission ?? true) && 		allOptionsDoMatch(conf1.options, conf2.options) 	); }
// function allOptionsDoMatch( 	options1?: ApplicationCommandOption[], 	options2?: ApplicationCommandOption[] ) { 	return Boolean( 		options1 === options2 || 			(options1 && 				options2 && 				options1.length === options2.length && 				[...options1.keys()].every((k) => optionDoesMatch(options1[k], options2[k]))) 	); }
// function optionDoesMatch( 	option1: ApplicationCommandOption, 	option2: ApplicationCommandOption ): boolean { 	return ( 		option1.name === option2.name && 		option1.description === option2.description && 		Boolean(option1.required) === Boolean(option2.required) && 		option1.type === option2.type && 		(option1.options === option2.options || 			(!option1.options?.length && !option2.options?.length) || 			allOptionsDoMatch(option1.options ?? [], option2.options ?? [])) 	); }
// function standardizeConfig({ 	name, 	type = "CHAT_INPUT", 	description, 	defaultPermission = true, 	options = [], }: StrictCommand | ChatInputApplicationCommandData): ApplicationCommandDataNoEnums { 	return { name, type, description, defaultPermission, options: options.map(standardizeOption) }; }

//  function standardizeConfig(config: StrictCommand | ChatInputApplicationCommandData): ChatInputApplicationCommandData {
//  	return { ...config,options:config.options?[...config.options]:undefined};
//  }

// const enumToString = [
// 	null,
// 	"SUB_COMMAND",
// 	"SUB_COMMAND_GROUP",
// 	"STRING",
// 	"INTEGER",
// 	"BOOLEAN",
// 	"USER",
// 	"CHANNEL",
// 	"ROLE",
// 	"MENTIONABLE",
// 	"NUMBER",
// ] as const;

// function standardizeOption<D extends StrictOption | APIApplicationCommandOption>({
// 	type,
// 	name,
// 	description,
// 	required,
// 	choices, //
// 	options,
// }: D): ApplicationCommandOption {
// 	type = typeof type === "string" ? type : (enumToString[type] as ApplicationCommandOption["type"]);
// 	return {
// 		type,
// 		name,
// 		description,
// 		required,
// 		choices: choices as ApplicationCommandOptionChoice[],
// 		options: options?.map(standardizeOption),
// 	};
// }

// function unfreezeObject<O extends Object>(o:Readonly<O>):O{}
// function unConst(c: StrictOption): ApplicationCommandOptionData;
// function unConst(c: StrictCommand): ChatInputApplicationCommandData;
// function unConst(
// 	c: StrictCommand | StrictOption
// ): ApplicationCommandOptionData | ChatInputApplicationCommandData {
// 	const { options, ...rest } = c;
// 	return {
// 		...rest,
// 		options: options && ([...(options as any[]).map(unConst)] as any),
// 	} as any;
// }
function unConst(c: StrictCommand): ChatInputApplicationCommandData {
	return c as ChatInputApplicationCommandData;
}