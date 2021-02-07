import { Client } from "discord.js";
import { makeTrashable } from "../utils/message-actions.js";
import { enforceWellStructuredCommand, enforceWellStructuredResponse, enforceWellStructuredTrigger, escapeRegExp, mixedIncludes, meetsConstraints, } from "./checkers.js";
export const startupTimestamp = new Date();
export const client = new Client();
let _clientReadyResolve;
/** resolves when the client has connected */
export let clientReady = new Promise((resolve) => {
    _clientReadyResolve = resolve;
});
// whether the client has completed its first connection
let hasConnected = false;
//
// bot functionality stuff
//
let prefixCheck;
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
export function setPrefix(prefix) {
    if (typeof prefix === "string") {
        const newRegex = new RegExp(`^(${escapeRegExp(prefix).replace(/^\^+/, "")})(?<command>\\S*)(?: (?<args>.+))?$`);
        prefixCheck = (s) => (s.startsWith(prefix) ? s.match(newRegex) : null);
    }
    else {
        prefixCheck = (s) => s.match(prefix);
    }
}
setPrefix("!");
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
/** starts the client up. resolves (to the client) when the client has connected/is ready */
export function init(token) {
    client
        .on("message", async (msg) => {
        // quit if this is the bot's own message
        if (msg.author === client.user)
            return;
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
const commands = [];
/**
 * either a Sendable, or a function that generates a Sendable.
 * if it's a function, it's passed the TriggerParams object
 */
export function addCommand(...commands_) {
    commands_.forEach((c) => {
        enforceWellStructuredCommand(c.command);
        enforceWellStructuredResponse(c.response);
    });
    commands.push(...commands_);
}
const triggers = [];
/**
 * either a Sendable, or a function that generates a Sendable.
 * if it's a function, it's passed the TriggerParams object
 */
export function addTrigger(...triggers_) {
    triggers_.forEach((t) => {
        enforceWellStructuredTrigger(t.trigger);
        enforceWellStructuredResponse(t.response);
    });
    triggers.push(...triggers_);
}
// given a command string, find and run the appropriate function
async function routeMessage(msg) {
    var _a, _b, _c, _d, _e;
    const commandMatch = prefixCheck(msg.content);
    let foundRoute = (commandMatch &&
        commands.find((r) => mixedIncludes(r.command, commandMatch.groups.command))) ||
        triggers.find((t) => t.trigger.test(msg.content));
    if (foundRoute) {
        let { response, trashable, reportViaReaction } = foundRoute;
        if (!meetsConstraints(msg, foundRoute)) {
            console.log(`constraints suppressed a response to ${msg.author.username} requesting ${(_a = foundRoute.command) !== null && _a !== void 0 ? _a : foundRoute.trigger.source}`);
            return;
        }
        try {
            if (typeof response === "function") {
                const { guild, channel, author: user } = msg;
                response =
                    (await response({
                        msg,
                        command: (_c = (_b = commandMatch === null || commandMatch === void 0 ? void 0 : commandMatch.groups) === null || _b === void 0 ? void 0 : _b.command) !== null && _c !== void 0 ? _c : "",
                        args: (_e = (_d = commandMatch === null || commandMatch === void 0 ? void 0 : commandMatch.groups) === null || _d === void 0 ? void 0 : _d.args) !== null && _e !== void 0 ? _e : "",
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
        }
        catch (e) {
            if (reportViaReaction) {
                await msg.react("⚠");
            }
            console.log(e);
        }
    }
}
