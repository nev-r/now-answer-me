import { Client } from "discord.js";
import { arrayify } from "one-stone/array";
import { registerCommandsOnConnect, routeAutocomplete, routeContextMenuCommand, routeSlashCommand, } from "./slash-commands.js";
import { routeComponentInteraction } from "./message-components.js";
export { addSlashCommand, setPermittedCommandUserInGuild, setPermittedCommandUserEverywhere, } from "./slash-commands.js";
export { createComponentButtons, createComponentSelects } from "./message-components.js";
export const startupTimestamp = new Date();
const clientOptions = {
    intents: ["Guilds", "GuildEmojisAndStickers", "GuildMembers"],
    rest: {
        rejectOnRateLimit: (_) => {
            console.log("rejectOnRateLimit");
            console.log(_);
            return false;
        },
    },
};
export const client = new Client(clientOptions);
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
 * completely replaces existing `activities` statuses. you may want `addActivity` instead
 */
export function setActivities(activities_) {
    activities = activities_;
}
// list of functions to run on initial connection
let onConnects = [];
/**
 * add function(s) to run upon first logging into discord
 */
export function addOnConnect(...onConnect_) {
    onConnects.push(...onConnect_);
}
// list of functions to run on reconnection
let onReconnects = [];
/**
 * add function(s) to run upon any reconnection to discord
 */
export function addOnReconnect(...onReconnect_) {
    onReconnects.push(...onReconnect_);
}
// list of functions to run after bot commands are setup
let onReadies = [];
/**
 * add function(s) to run after bot is ready
 * (startup tasks are completed, slash commands are registered)
 */
export function addOnReady(...onReady_) {
    onReadies.push(...onReady_);
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
/** starts the client up. resolves (to the client) when the client has connected/is ready */
export function init(token) {
    client
        .on("interactionCreate", async (interaction) => {
        try {
            if (interaction.isAutocomplete())
                await routeAutocomplete(interaction);
            if (interaction.isCommand())
                await routeSlashCommand(interaction);
            if (interaction.isContextMenuCommand())
                await routeContextMenuCommand(interaction);
            else if (interaction.isMessageComponent())
                await routeComponentInteraction(interaction);
        }
        catch (e) {
            console.log("interaction error!");
            console.log(e);
        }
    })
        .once("ready", async () => {
        clientStatus.hasConnected = true;
        startActivityUpkeep();
        try {
            await Promise.allSettled(onConnects.map((fnc) => fnc(client)));
            await registerCommandsOnConnect();
            _clientReadyResolve(client);
            await Promise.allSettled(onReadies.map((fnc) => fnc(client)));
        }
        catch (e) {
            console.log("once-ready error!");
            console.log(e);
        }
        // set performReconnects in 1s, so reconnect events don't fire the first time
        setTimeout(() => {
            clientStatus.performReconnects = true;
        }, 1000);
    })
        .on("ready", () => {
        try {
            clientStatus.performReconnects && onReconnects.forEach((fnc) => fnc(client));
        }
        catch (e) {
            console.log("on-ready error!");
            console.log(e);
        }
    })
        .login(token);
    return clientReady;
}
let currentActivityIndex = -1;
let currentlySetActivity = activities[currentActivityIndex];
function startActivityUpkeep() {
    setInterval(() => {
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
        try {
            client.user?.setActivity(activities[currentActivityIndex]);
        }
        catch (e) {
            console.log("upkeep error!");
            console.log(e);
        }
    }, 90000);
}
