import { ChannelType, Client, ClientOptions } from "discord.js";
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

const clientOptions: ClientOptions = {
	intents: ["Guilds", "GuildMessages", "GuildEmojisAndStickers", "GuildMembers"],
	rest: {
		rejectOnRateLimit: (_) => {
			console.log("rejectOnRateLimit");
			console.log(_);
			return false;
		},
	},
};

export const client = new Client(clientOptions);

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
 * completely replaces existing `activities` statuses. you may want `addActivity` instead
 */
export function setActivities(activities_: typeof activities) {
	activities = activities_;
}

// list of functions to run on initial connection
let onConnects: ((client_: Client) => Promise<void> | void)[] = [];

/**
 * add function(s) to run upon first logging into discord
 */
export function addOnConnect(...onConnect_: typeof onConnects) {
	onConnects.push(...onConnect_);
}

// list of functions to run on reconnection
let onReconnects: ((client_: Client) => void)[] = [];

/**
 * add function(s) to run upon any reconnection to discord
 */
export function addOnReconnect(...onReconnect_: typeof onReconnects) {
	onReconnects.push(...onReconnect_);
}

// list of functions to run after bot commands are setup
let onReadies: ((client_: Client) => Promise<void> | void)[] = [];

/**
 * add function(s) to run after bot is ready
 * (startup tasks are completed, slash commands are registered)
 */
export function addOnReady(...onReady_: typeof onReadies) {
	onReadies.push(...onReady_);
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
			if (doIgnoreDMs && msg.channel.type === ChannelType.DM) return;
			if (messageFilters.some((f) => f(msg) === false)) return;

			routeMessageCommand(msg);
		})
		.on("interactionCreate", async (interaction) => {
			if (interaction.isAutocomplete()) routeAutocomplete(interaction);
			if (interaction.isCommand()) routeSlashCommand(interaction);
			if (interaction.isContextMenuCommand()) routeContextMenuCommand(interaction);
			else if (interaction.isMessageComponent()) routeComponentInteraction(interaction);
		})
		.once("ready", async () => {
			clientStatus.hasConnected = true;
			startActivityUpkeep();

			await Promise.allSettled(onConnects.map((fnc) => fnc(client)));
			await registerCommandsOnConnect();
			_clientReadyResolve(client);
			await Promise.allSettled(onReadies.map((fnc) => fnc(client)));

			// set performReconnects in 1s, so reconnect events don't fire the first time
			setTimeout(() => {
				clientStatus.performReconnects = true;
			}, 1000);
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
