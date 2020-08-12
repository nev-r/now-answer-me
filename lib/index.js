import Discord from "discord.js";
export * from "./util.js";
export const startupTimestamp = new Date();
export const client = new Discord.Client();
let hasConnectedBefore = false;
// bot functionality stuff
export let prefix = "!";
export function setPrefix(prefix_) {
    prefix = prefix_;
}
export let testPrefix;
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
export function setCommandRegex() {
    commandRegex = new RegExp((env === "production" ? prefix : testPrefix) +
        "(?<command>[\\w?]+)(?: (?<args>.+))?$");
}
let activities = [];
/**
 * add discord presence statuses to cycle through
 */
export function addActivities(...activities_) {
    activities.push(...activities_);
}
/** completely replaces existing `activities` statuses. you may want `addActivities` */
export function setActivities(activities_) {
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
    setCommandRegex();
    client
        .on("message", (msg) => {
        var _a;
        // match command name and args
        const { command, args } = (msg.content.startsWith(prefix) && ((_a = msg.content.match(commandRegex)) === null || _a === void 0 ? void 0 : _a.groups)) ||
            noCommandMatch;
        // quit (↓ if no command)   or   (↓ if this is your own message)
        if (!command || msg.author === client.user)
            return;
        // dispatch to per-command subroutines
        routeCommand(msg, command, args);
    })
        .once("ready", () => {
        startActivityUpkeep();
        onConnect.forEach((fnc) => fnc(client));
        // set `hasConnectedBefore` after 10s, so reconnect events don't fire the first time
        setTimeout(() => {
            hasConnectedBefore = true;
        }, 10000);
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
const router = [];
export function addRoutes(...routes) {
    router.push(...routes);
}
function routeCommand(msg, command, args) {
    var _a, _b;
    (_b = (_a = router
        .find((r) => typeof r.command === "string"
        ? r.command === command
        : r.command.includes(command))) === null || _a === void 0 ? void 0 : _a.fnc(msg, args)) !== null && _b !== void 0 ? _b : console.log(`command not found: ${command}`);
}
