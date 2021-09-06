import { Client } from "discord.js";
import { arrayify } from "one-stone/array";
import { registerCommandsOnConnect, routeSlashCommand } from "./slash-commands.js";
import { routeComponentInteraction } from "./message-components.js";
import { routeMessageCommand } from "./message-commands.js";
export { addCommand, addTrigger, setPrefix } from "./message-commands.js";
export { addSlashCommand } from "./slash-commands.js";
export { createComponentButtons } from "./message-components.js";
export const startupTimestamp = new Date();
export const client = new Client({
    intents: [
        "GUILDS",
        "GUILD_MESSAGES",
        "DIRECT_MESSAGES",
        "DIRECT_MESSAGE_REACTIONS",
        "GUILD_EMOJIS_AND_STICKERS",
        "GUILD_MESSAGE_REACTIONS",
    ],
});
let _clientReadyResolve;
/** resolves when the client has connected */
export let clientReady = new Promise((resolve) => {
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
let activities = [];
/**
 * add 1 or more discord presence statuses to cycle through
 */
export function addActivity(...activities_) {
    activities.push(...activities_.map((a) => (typeof a === "string" ? { name: a } : a)));
}
/**
 * completely replaces existing `activities` statuses. you probably want `addActivity` instead
 */
export function setActivities(activities_) {
    activities = activities_;
}
// list of functions to run on initial connection
let onConnects = [];
/**
 * add function(s) to run upon first logging into discord
 *
 * the discord client will be passed as an arg
 */
export function addOnConnect(...onConnect_) {
    onConnects.push(...onConnect_);
}
/** completely replaces existing `onConnect` functions. prefer `addOnConnect` */
export function setOnConnect(onConnects_) {
    onConnects = onConnects_;
}
// list of functions to run on reconnection
let onReconnects = [];
/**
 * add function(s) to run upon any reconnection to discord
 *
 * the discord client will be passed as an arg
 */
export function addOnReconnect(...onReconnect_) {
    onReconnects.push(...onReconnect_);
}
/** completely replaces existing `onReconnect` functions. prefer `addOnReconnect` */
export function setOnReconnect(onReconnect_) {
    onReconnects = onReconnect_;
}
const ignoredServerIds = new Set();
export function ignoreServerId(...serverIds) {
    for (const serverIdGroup of serverIds) {
        for (const s of arrayify(serverIdGroup)) {
            ignoredServerIds.add(s);
        }
    }
}
const ignoredUserIds = new Set();
export function ignoreUserId(...userIds) {
    for (const userIdGroup of userIds) {
        for (const u of arrayify(userIdGroup)) {
            ignoredUserIds.add(u);
        }
    }
}
const messageFilters = [];
export function addMessageFilter(...messageFilter) {
    for (const f of messageFilter) {
        messageFilters.push(f);
    }
}
let doIgnoreDMs = false;
export function ignoreDms(setting = true) {
    doIgnoreDMs = setting;
}
/** starts the client up. resolves (to the client) when the client has connected/is ready */
export function init(token) {
    client
        .on("messageCreate", async (msg) => {
        var _a;
        // quit if this is the bot's own message
        if (msg.author === client.user)
            return;
        if (ignoredServerIds.has((_a = msg.guild) === null || _a === void 0 ? void 0 : _a.id))
            return;
        if (ignoredUserIds.has(msg.author.id))
            return;
        if (doIgnoreDMs && msg.channel.type === "DM")
            return;
        if (messageFilters.some((f) => f(msg) === false))
            return;
        routeMessageCommand(msg);
    })
        .on("interactionCreate", async (interaction) => {
        if (interaction.isCommand() || interaction.isContextMenu())
            routeSlashCommand(interaction);
        else if (interaction.isMessageComponent())
            routeComponentInteraction(interaction);
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
        var _a;
        // no need to do anything this loop, if there's no activities
        if (!activities.length)
            return;
        // increment and fix overrun
        currentActivityIndex++;
        if (!activities[currentActivityIndex])
            currentActivityIndex = 0;
        const newActivity = activities[currentActivityIndex];
        // if it hasn't effectively changed, nothing to do
        if (currentlySetActivity === newActivity)
            return;
        // do an update
        currentlySetActivity = newActivity;
        (_a = client.user) === null || _a === void 0 ? void 0 : _a.setActivity(activities[currentActivityIndex]);
    }, 90000);
}
