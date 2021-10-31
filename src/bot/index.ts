import { Client } from "discord.js";
import { Message } from "discord.js";
import type { ActivityOptions } from "discord.js";
import { arrayify } from "one-stone/array";
import {
	registerCommandsOnConnect,
	routeAutocomplete,
	routeContextMenuCommand,
	routeSlashCommand,
} from "./slash-commands.js";
import { routeComponentInteraction } from "./message-components.js";
import { routeMessageCommand } from "./message-commands.js";
export { addCommand, addTrigger, setPrefix } from "./message-commands.js";
export {
	addSlashCommand,
	setPermittedCommandUserInGuild,
	setPermittedCommandUserEverywhere,
} from "./slash-commands.js";
export { createComponentButtons, createComponentSelects } from "./message-components.js";

export const startupTimestamp = new Date();
export const client = new Client({
	intents: [
		"GUILDS",
		"GUILD_MESSAGES",
		"DIRECT_MESSAGES",
		"DIRECT_MESSAGE_REACTIONS",
		"GUILD_EMOJIS_AND_STICKERS",
		"GUILD_MESSAGE_REACTIONS",
		"GUILD_MEMBERS",
	],
});

let _clientReadyResolve: (value: Client | PromiseLike<Client>) => void;

/** resolves when the client has connected */
export let clientReady: Promise<Client> = new Promise((resolve) => {
	_clientReadyResolve = resolve;
});
export const clientStatus = {
	// whether the client has completed its first connection
	hasConnected: false,
	// whether the client has completed its onConnects
	performReconnects: false,
};

//
// bot functionality stuff
//

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
			if (doIgnoreDMs && msg.channel.type === "DM") return;
			if (messageFilters.some((f) => f(msg) === false)) return;

			routeMessageCommand(msg);
		})
		.on("interactionCreate", async (interaction) => {
			if (interaction.isAutocomplete()) routeAutocomplete(interaction);
			if (interaction.isCommand()) routeSlashCommand(interaction);
			if (interaction.isContextMenu()) routeContextMenuCommand(interaction);
			else if (interaction.isMessageComponent()) routeComponentInteraction(interaction);
		})
		.once("ready", async () => {
			clientStatus.hasConnected = true;
			startActivityUpkeep();

			registerCommandsOnConnect();
			onConnects.forEach((fnc) => fnc(client));

			// set `performReconnects` in 1s, so reconnect events don't fire the first time
			setTimeout(() => {
				clientStatus.performReconnects = true;
			}, 1000);
			_clientReadyResolve(client);
		})
		.on("ready", () => {
			clientStatus.performReconnects && onReconnects.forEach((fnc) => fnc(client));
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
