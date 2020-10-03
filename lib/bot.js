import Discord from "discord.js";
export const startupTimestamp = new Date();
export const client = new Discord.Client();
let _clientReadyResolve;
/** resolves when the client has connected */
export let clientReadyPromise = new Promise((resolve) => {
    _clientReadyResolve = resolve;
});
/** check if the client has done its first connection */
export let clientReady = false;
//
// bot functionality stuff
//
// let prefixRegex: RegExp;
let commandRegex;
/**
 * set the command prefix (i.e. `!` or `?` or whatever)
 *
 * @param prefix a string will be used literally. a regex can be used instead,
 * like `!|?` but it shouldn't capture the command word or the line beginning
 */
export function setPrefix(prefix) {
    const newPrefix = (typeof prefix === "string"
        ? escapeRegExp(prefix)
        : prefix.source).replace(/^\^+/, "");
    // prefixRegex = new RegExp(`^(${newPrefix})`);
    commandRegex = new RegExp(`^(${newPrefix})(?<command>[\\w?]+)(?: (?<args>.+))?$`);
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
 * completely replaces existing `activities` statuses. you may want `addActivity` instead
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
export function setOnConnects(onConnects_) {
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
        .on("message", (msg) => {
        var _a, _b;
        // quit if this is the bot's own message
        if (msg.author === client.user)
            return;
        // match command name and args
        const { command, args } = (_b = (_a = msg.content.match(commandRegex)) === null || _a === void 0 ? void 0 : _a.groups) !== null && _b !== void 0 ? _b : {};
        if (command)
            routeCommand(msg, command, args);
        else
            routeTrigger(msg);
    })
        .once("ready", () => {
        startActivityUpkeep();
        onConnects.forEach((fnc) => fnc(client));
        // set `hasConnectedBefore` in 5s, so reconnect events don't fire the first time
        setTimeout(() => {
            clientReady = true;
        }, 1000);
        _clientReadyResolve(client);
    })
        .on("ready", () => {
        clientReady && onReconnects.forEach((fnc) => fnc(client));
    })
        .login(token);
    return clientReadyPromise;
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
/**
 * either a ValidMessage, or a function that generates a ValidMessage.
 * if it's a function, it's passed the TriggerParams object
 */
export function addCommand(...commands_) {
    commands.push(...commands_);
}
const triggers = [];
/**
 * either a ValidMessage, or a function that generates a ValidMessage.
 * if it's a function, it's passed the TriggerParams object
 */
export function addTrigger(...triggers_) {
    triggers.push(...triggers_);
}
// given a command string, find and run the appropriate function
async function routeCommand(msg, command, args) {
    var _a;
    let { response } = (_a = commands.find((r) => typeof r.command === "string"
        ? r.command === command
        : r.command.includes(command))) !== null && _a !== void 0 ? _a : {};
    if (response) {
        if (typeof response === "function")
            response =
                (await response({ msg, command, args, content: msg.content })) ||
                    undefined;
        try {
            response && msg.channel.send(response);
        }
        catch (e) {
            console.log(e);
        }
    }
}
// given a message, see if it matches a trigger, then run the corresponding function
async function routeTrigger(msg) {
    var _a;
    let { response } = (_a = triggers.find((t) => t.trigger.test(msg.content))) !== null && _a !== void 0 ? _a : {};
    if (response) {
        if (typeof response === "function")
            response = (await response({ msg, content: msg.content })) || undefined;
        try {
            response && msg.channel.send(response);
        }
        catch (e) {
            console.log(e);
        }
    }
}
// via MDN
function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
}
