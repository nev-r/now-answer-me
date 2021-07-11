import {
	ApplicationCommandData,
	Client,
	CommandInteraction,
	CommandInteractionOption,
	GuildChannel,
	GuildMember,
	GuildResolvable,
	Role,
	User,
} from "discord.js";
import { Message } from "discord.js";
import type { ActivityOptions } from "discord.js";
import type {
	CommandResponse,
	Constraints,
	Extras,
	Sendable,
	SlashCommandResponse,
	TriggerResponse,
} from "../types/types-bot.js";
import { makeTrashable } from "../utils/message-actions.js";
import {
	enforceWellStructuredCommand,
	enforceWellStructuredResponse,
	enforceWellStructuredTrigger,
	escapeRegExp,
	mixedIncludes,
	meetsConstraints,
} from "./checkers.js";
import { sleep } from "one-stone/promise";
import { delMsg, sendableToMessageOptions } from "../utils/misc.js";
import { arrayify } from "one-stone/array";
import { CommandOptions, StrictCommand } from "../types/the-option-understander-has-signed-on.js";

export const startupTimestamp = new Date();
export const client = new Client({
	intents: [
		"GUILDS",
		"GUILD_MESSAGES",
		"DIRECT_MESSAGES",
		"DIRECT_MESSAGE_REACTIONS",
		"GUILD_EMOJIS",
		"GUILD_MESSAGE_REACTIONS",
	],
});

let _clientReadyResolve: (value: Client | PromiseLike<Client>) => void;

/** resolves when the client has connected */
export let clientReady: Promise<Client> = new Promise((resolve) => {
	_clientReadyResolve = resolve;
});

// whether the client has completed its first connection
let hasConnected = false;

//
// bot functionality stuff
//

let prefixCheck: (s: string) => ReturnType<string["match"]>;

/**
 * set the command prefix (i.e. "!"" or "?"" or whatever)
 *
 * @param prefix a string will be used literally. a regex can be used instead,
 * but it needs to be carefully formatted, including (likely) a `^`, and needs
 * named `(<command>` and `(<args>` subpatterns
 *
 * ideally, use a string prefix because it's going to be a lot faster to check
 * startsWith, instead of executing a regex on every message that goes by
 */
export function setPrefix(prefix: string | RegExp) {
	if (typeof prefix === "string") {
		const newRegex = new RegExp(
			`^(${escapeRegExp(prefix).replace(/^\^+/, "")})(?<command>\\S*)(?: (?<args>.+))?$`
		);
		prefixCheck = (s) => (s.startsWith(prefix) ? s.match(newRegex) : null);
	} else {
		prefixCheck = (s) => s.match(prefix);
	}
}
setPrefix("!");

// list of statuses for the bot to cycle through
let activities: ActivityOptions[] = [];

/**
 * add 1 or more discord presence statuses to cycle through
 */
export function addActivity(...activities_: (string | ActivityOptions)[]) {
	activities.push(...activities_.map((a) => (typeof a === "string" ? { name: a } : a)));
}

/**
 * completely replaces existing `activities` statuses. you probably want `addActivity` instead
 */
export function setActivities(activities_: typeof activities) {
	activities = activities_;
}

// list of functions to run on initial connection
let onConnects: ((client_: Client) => void)[] = [];

/**
 * add function(s) to run upon first logging into discord
 *
 * the discord client will be passed as an arg
 */
export function addOnConnect(...onConnect_: typeof onConnects) {
	onConnects.push(...onConnect_);
}

/** completely replaces existing `onConnect` functions. prefer `addOnConnect` */
export function setOnConnect(onConnects_: typeof onConnects) {
	onConnects = onConnects_;
}

// list of functions to run on reconnection
let onReconnects: ((client_: Client) => void)[] = [];

/**
 * add function(s) to run upon any reconnection to discord
 *
 * the discord client will be passed as an arg
 */
export function addOnReconnect(...onReconnect_: typeof onReconnects) {
	onReconnects.push(...onReconnect_);
}

/** completely replaces existing `onReconnect` functions. prefer `addOnReconnect` */
export function setOnReconnect(onReconnect_: typeof onReconnects) {
	onReconnects = onReconnect_;
}

const ignoredServerIds = new Set<string>();
export function ignoreServerId(...serverIds: (string | string[])[]) {
	for (const serverIdGroup of serverIds) {
		for (const s of arrayify(serverIdGroup)) {
			ignoredServerIds.add(s);
		}
	}
}

const ignoredUserIds = new Set<string>();
export function ignoreUserId(...userIds: (string | string[])[]) {
	for (const userIdGroup of userIds) {
		for (const u of arrayify(userIdGroup)) {
			ignoredUserIds.add(u);
		}
	}
}
type MessageFilter = (msg: Message) => boolean;

const messageFilters: MessageFilter[] = [];
export function addMessageFilter(...messageFilter: MessageFilter[]) {
	for (const f of messageFilter) {
		messageFilters.push(f);
	}
}

let doIgnoreDMs = false;
export function ignoreDms(setting = true) {
	doIgnoreDMs = setting;
}

/** starts the client up. resolves (to the client) when the client has connected/is ready */
export function init(token: string) {
	client
		.on("messageCreate", async (msg: Message) => {
			// quit if this is the bot's own message
			if (msg.author === client.user) return;
			if (ignoredServerIds.has(msg.guild?.id!)) return;
			if (ignoredUserIds.has(msg.author.id)) return;
			if (doIgnoreDMs && msg.channel.type === "dm") return;
			if (messageFilters.some((f) => f(msg) === false)) return;

			routeMessageCommand(msg);
		})
		.on("interactionCreate", async (interaction) => {
			if (interaction.isCommand()) {
				routeSlashCommand(interaction);
			} else if (interaction.isButton()) {
				interaction.update({
					content: (
						parseFloat(interaction.message.content) + (interaction.customId === "abc" ? -1 : 1)
					).toString(),
				});
			}
		})
		.once("ready", () => {
			startActivityUpkeep();

			while (needRegistering.length) {
				const nameToRegister = needRegistering.pop();
				if (nameToRegister) {
					const toRegister = slashCommands[nameToRegister];
					if (toRegister) {
						registerSlashCommand(toRegister.where, toRegister.config);
					}
				}
			}

			onConnects.forEach((fnc) => fnc(client));

			// set `clientReady` in 1s, so reconnect events don't fire the first time
			setTimeout(() => {
				hasConnected = true;
			}, 1000);
			_clientReadyResolve(client);
		})
		.on("ready", () => {
			hasConnected && onReconnects.forEach((fnc) => fnc(client));
		})
		.login(token);
	return clientReady;
}

let currentActivityIndex = -1;
let currentlySetActivity = activities[currentActivityIndex];

function startActivityUpkeep() {
	setInterval(() => {
		// no need to do anything this loop, if there's no activities
		if (!activities.length) return;

		// increment and fix overrun
		currentActivityIndex++;
		if (!activities[currentActivityIndex]) currentActivityIndex = 0;

		const newActivity = activities[currentActivityIndex];
		// if it hasn't effectively changed, nothing to do
		if (currentlySetActivity === newActivity) return;

		// do an update
		currentlySetActivity = newActivity;
		client.user?.setActivity(activities[currentActivityIndex]);
	}, 90000);
}

const commands: ({
	command: string | string[];
	response: CommandResponse;
} & Constraints &
	Extras)[] = [];

/**
 * either a Sendable, or a function that generates a Sendable.
 * if it's a function, it's passed the TriggerParams object
 */
export function addCommand(...commands_: typeof commands) {
	commands_.forEach((c) => {
		enforceWellStructuredCommand(c.command);
		enforceWellStructuredResponse(c.response);
	});
	commands.push(...commands_);
}

const slashCommands: Record<
	string,
	{
		where: "global" | GuildResolvable;
		config: StrictCommand;
		handler: SlashCommandResponse<any>;
		ephemeral?: boolean;
		defer?: boolean;
		deferIfLong?: boolean;
	}
> = {};
const needRegistering: string[] = [];

export function addSlashCommand<
	Config extends StrictCommand // Command<VagueOption>
>(command: {
	where: "global" | GuildResolvable;
	config: Config;
	handler: SlashCommandResponse<CommandOptions<Config>>;
	ephemeral?: boolean;
	defer?: boolean;
	deferIfLong?: boolean;
}) {
	if (hasConnected) registerSlashCommand(command.where, command.config);
	else slashCommands[command.config.name] = command;
}

const triggers: ({
	trigger: RegExp;
	response: TriggerResponse;
} & Constraints &
	Extras)[] = [];

/**
 * either a Sendable, or a function that generates a Sendable.
 * if it's a function, it's passed the TriggerParams object
 */
export function addTrigger(...triggers_: typeof triggers) {
	triggers_.forEach((t) => {
		enforceWellStructuredTrigger(t.trigger);
		enforceWellStructuredResponse(t.response);
	});
	triggers.push(...triggers_);
}

// given a command string, find and run the appropriate function
async function routeMessageCommand(msg: Message) {
	const commandMatch = prefixCheck(msg.content);
	let foundRoute =
		(commandMatch &&
			commands.find((r) => mixedIncludes(r.command, commandMatch.groups!.command))) ||
		triggers.find((t) => t.trigger.test(msg.content));

	if (foundRoute) {
		let {
			response: responseGenerator,
			trashable,
			selfDestructSeconds,
			reportViaReaction,
		} = foundRoute;
		if (!meetsConstraints(msg, foundRoute)) {
			console.log(
				`constraints suppressed a response to ${msg.author.username} requesting ${
					(foundRoute as any).command ?? (foundRoute as any).trigger.source
				}`
			);
			return;
		}

		try {
			let results: Sendable | Message | undefined;
			if (typeof responseGenerator === "function") {
				const { guild, channel, author: user } = msg;
				results =
					(await responseGenerator({
						msg,
						command: commandMatch?.groups?.command ?? "",
						args: commandMatch?.groups?.args?.trim() ?? "",
						content: msg.content.trim(),
						channel,
						guild,
						user,
					})) || "";
			} else {
				results = responseGenerator;
			}
			if (reportViaReaction) {
				let reactionEmoji: string | undefined;
				if (typeof results === "string") reactionEmoji = getReactionEmojiFromString(results);
				if (!reactionEmoji) {
					reactionEmoji = results === false ? "🚫" : "☑";
				}
				await msg.react(reactionEmoji);
				return;
			}
			if (results) {
				let sentMessage: Message | undefined;
				// if the command already sent and returned a message
				if (results instanceof Message) sentMessage = results;
				else {
					sentMessage = await msg.channel.send(sendableToMessageOptions(results));
				}
				if (sentMessage) {
					if (trashable)
						makeTrashable(sentMessage, trashable === "requestor" ? msg.author.id : undefined);
					if (selfDestructSeconds) {
						sleep(selfDestructSeconds * 1000).then(() => delMsg(sentMessage));
					}
				}
			}
		} catch (e) {
			if (reportViaReaction) {
				await msg.react("⚠");
			}
			console.log(e);
		}
	}
}

// given a command string, find and run the appropriate function
async function routeSlashCommand(interaction: CommandInteraction) {
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
			const optionDict = createDictFromOptions([...interaction.options.values()]);
			const optionList = Object.entries(optionDict);
			// const optionList = [
			// 	...interaction.options.map(
			// 		(o) => [o.name, o.value] as [string, CommandInteractionOption["value"]]
			// 	),
			// ];

			results =
				(await handler({
					channel,
					guild,
					user,
					optionList,
					optionDict,
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

function getReactionEmojiFromString(str: string) {
	// string manip
	str = str.replace(/\uFE0F|\u20E3/g, "");
	if ([...str].length === 1) {
		if (/^[\d*#]$/.test(str)) return str + "\uFE0F\u20E3";
		if (/^\p{Emoji}$/u.test(str)) return str;
	}

	const matched = str.match(/^<a?:(\w+):(?<snowflake>\d+)>$/);
	if (matched?.groups?.snowflake) str = matched.groups.snowflake;

	// try resolving
	const resolved = client.emojis.resolve(str as `${bigint}`);
	if (resolved) return resolved.id;
}

async function registerSlashCommand(where: "global" | GuildResolvable, config: StrictCommand) {
	await clientReady;
	const commandLocation = where === "global" ? client.application : client.guilds.resolve(where);
	if (!commandLocation) throw `couldn't resolve ${where} to a guild`;
	// commandLocation.commands.cache('')
	console.log("pretending to register a command named", config.name);
	console.log("here:", commandLocation);
	console.log("command count:", commandLocation.commands.cache.size);
}

function createDictFromOptions(
	options: CommandInteractionOption[],
	dict: Record<
		string,
		| string
		| number
		| boolean
		| CommandInteractionOption["user"]
		| CommandInteractionOption["member"]
		| CommandInteractionOption["role"]
		| CommandInteractionOption["channel"]
		| undefined
	> = {}
) {
	for (const opt of options) {
		if (opt.type === "SUB_COMMAND" || opt.type === "SUB_COMMAND_GROUP")
			createDictFromOptions(opt.options ? [...opt.options.values()] : []);
		else {
			dict[opt.name] =
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
	return dict;
}
