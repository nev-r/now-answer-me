import Discord from "discord.js";
export * from "./util.js";
export const startupTimestamp = new Date();
export const client = new Discord.Client();
let hasConnectedBefore = false;
let _clientReadyResolve;
export const clientReadyPromise = new Promise((resolve) => {
    _clientReadyResolve = resolve;
});
export let clientReady = false;
// bot functionality stuff
export let prefix = "!";
export function setPrefix(prefix_) {
    prefix = prefix_;
}
export let testPrefix = "!";
export function setTestPrefix(testPrefix_) {
    testPrefix = testPrefix_;
}
export let env = "production";
/**
 * `'test'|false` for test env,
 * `'production'|true` for production
 */
export function setEnv(env_) {
    env = env_ === true ? "production" : env_ === false ? "test" : env_;
}
let commandRegex;
export function setupCommandRegex() {
    commandRegex = new RegExp("^" +
        escapeRegExp(env === "production" ? prefix : testPrefix) +
        "(?<command>[\\w?]+)(?: (?<args>.+))?$");
}
let activities = [];
/**
 * add discord presence statuses to cycle through
 */
export function addActivity(...activities_) {
    activities.push(...activities_);
}
/** completely replaces existing `activities` statuses. you may want `addActivity` */
export function setActivity(activities_) {
    activities = activities_;
}
let onConnect = [];
/**
 * add function(s) to run upon first logging into discord
 *
 * the discord client will be passed as an arg
 */
export function addOnConnect(...onConnect_) {
    onConnect.push(...onConnect_);
}
/** completely replaces existing `onConnect` functions. prefer `addOnConnect` */
export function setOnConnect(onConnect_) {
    onConnect = onConnect_;
}
let onReconnect = [];
/**
 * add function(s) to run upon any reconnection to discord
 *
 * the discord client will be passed as an arg
 */
export function addOnReconnect(...onReconnect_) {
    onReconnect.push(...onReconnect_);
}
/** completely replaces existing `onReconnect` functions. prefer `addOnReconnect` */
export function setOnReconnect(onReconnect_) {
    onReconnect = onReconnect_;
}
const noCommandMatch = { command: undefined, args: undefined };
export function init(token) {
    setupCommandRegex();
    client
        .on("message", (msg) => {
        var _a;
        // quit if this is your own message
        if (msg.author === client.user)
            return;
        // match command name and args
        const { command, args } = (msg.content.startsWith(prefix) && ((_a = msg.content.match(commandRegex)) === null || _a === void 0 ? void 0 : _a.groups)) ||
            noCommandMatch;
        if (command)
            routeCommand(msg, command, args);
        else
            routeTrigger(msg);
    })
        .once("ready", () => {
        startActivityUpkeep();
        onConnect.forEach((fnc) => fnc(client));
        // set `hasConnectedBefore` after 5s, so reconnect events don't fire the first time
        setTimeout(() => {
            hasConnectedBefore = true;
        }, 5000);
        _clientReadyResolve(true);
        clientReady = true;
    })
        .on("ready", () => {
        hasConnectedBefore && onReconnect.forEach((fnc) => fnc(client));
    })
        .login(token);
    return client;
}
let activitiesIndex = 0;
function startActivityUpkeep() {
    setInterval(() => {
        var _a;
        activitiesIndex++;
        if (!activities[activitiesIndex])
            activitiesIndex = 0;
        activities.length &&
            activities[activitiesIndex] && ((_a = client.user) === null || _a === void 0 ? void 0 : _a.setActivity(activities[activitiesIndex]));
    }, 30000);
}
const commands = [];
export function addCommand(...commands_) {
    commands.push(...commands_);
}
const triggers = [];
export function addTrigger(...triggers_) {
    triggers.push(...triggers_);
}
async function routeCommand(msg, command, args) {
    var _a;
    let { fnc, response } = (_a = commands.find((r) => typeof r.command === "string"
        ? r.command === command
        : r.command.includes(command))) !== null && _a !== void 0 ? _a : {};
    if (fnc)
        fnc(msg, args);
    else if (response) {
        if (typeof response === "function")
            response = await response(msg, msg.content);
        try {
            msg.channel.send(response);
        }
        catch (e) {
            console.log(e);
        }
    }
}
async function routeTrigger(msg) {
    var _a;
    let { fnc, response } = (_a = triggers.find((t) => t.trigger.test(msg.content))) !== null && _a !== void 0 ? _a : {};
    if (fnc)
        fnc(msg, msg.content);
    else if (response) {
        if (typeof response === "function")
            response = await response(msg, msg.content);
        try {
            msg.channel.send(response);
        }
        catch (e) {
            console.log(e);
        }
    }
}
// via MDN
function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
