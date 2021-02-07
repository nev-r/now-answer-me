import { Client } from "discord.js";
import type { Message, ActivityOptions } from "discord.js";
import type { CommandResponse, Constraints, Extras, TriggerResponse } from "../types/types-bot.js";
import { makeTrashable } from "../utils/message-actions.js";
import {
	enforceWellStructuredCommand,
	enforceWellStructuredResponse,
	enforceWellStructuredTrigger,
	escapeRegExp,
	mixedIncludes,
	meetsConstraints,
} from "./checkers.js";

export const startupTimestamp = new Date();
export const client = new Client();

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

/** starts the client up. resolves (to the client) when the client has connected/is ready */
export function init(token: string) {
	client
		.on("message", async (msg: Message) => {
			// quit if this is the bot's own message
			if (msg.author === client.user) return;
			routeMessage(msg);
		})
		.once("ready", () => {
			startActivityUpkeep();
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
async function routeMessage(msg: Message) {
	const commandMatch = prefixCheck(msg.content);
	let foundRoute =
		(commandMatch &&
			commands.find((r) => mixedIncludes(r.command, commandMatch.groups!.command))) ||
		triggers.find((t) => t.trigger.test(msg.content));

	if (foundRoute) {
		let { response, trashable, reportViaReaction } = foundRoute;
		if (!meetsConstraints(msg, foundRoute)) {
			console.log(
				`constraints suppressed a response to ${msg.author.username} requesting ${
					(foundRoute as any).command ?? (foundRoute as any).trigger.source
				}`
			);
			return;
		}

		try {
			if (typeof response === "function") {
				const { guild, channel, author: user } = msg;
				response =
					(await response({
						msg,
						command: commandMatch?.groups?.command ?? "",
						args: commandMatch?.groups?.args ?? "",
						content: msg.content,
						channel,
						guild,
						user,
					})) || "";
			}
			if (reportViaReaction) {
				await msg.react(response === false ? "🚫" : "☑");
				return;
			}
			if (response) {
				const sentMessage = await msg.channel.send(response);
				if (trashable)
					makeTrashable(sentMessage, trashable === "requestor" ? msg.author.id : undefined);
			}
		} catch (e) {
			if (reportViaReaction) {
				await msg.react("⚠");
			}
			console.log(e);
		}
	}
}
