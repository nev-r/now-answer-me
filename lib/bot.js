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
// let prefixString: string|undefined;
// let prefixRegex: RegExp|undefined;
let prefixCheck;
// let commandRegex: RegExp;
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
        // match command
        const isCommand = prefixCheck(msg.content);
        if (isCommand) {
            const routed = await routeCommand(msg, isCommand.groups.command, isCommand.groups.args);
            if (routed)
                return;
            // done if routed successfully.
        }
        // otherwise, check for a trigger
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
    commands_.forEach((c) => {
        enforceWellStructuredCommand(c.command);
        enforceWellStructuredResponse(c.response);
    });
    commands.push(...commands_);
}
const triggers = [];
/**
 * either a ValidMessage, or a function that generates a ValidMessage.
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
async function routeCommand(msg, command, args) {
    let foundCommand = commands.find((r) => r.command === command || r.command.includes(command));
    if (foundCommand) {
        let { response } = foundCommand;
        if (!meetsConstraints(msg, foundCommand)) {
            console.log(`constraints suppressed a response to ${msg.author.username} requesting ${command}`);
            return;
        }
        if (typeof response === "function")
            response =
                (await response({ msg, command, args, content: msg.content })) || "";
        try {
            response && (await msg.channel.send(response));
        }
        catch (e) {
            console.log(e);
        }
        // let upstream know we successfully found a route
        return true;
    }
}
function meetsConstraints(msg, { allowOnly, allow, block }) {
    const { author: { id: authorId }, channel: { id: channelId }, guild, } = msg;
    const guildId = guild === null || guild === void 0 ? void 0 : guild.id;
    // if an allow constraint exists, and it's met, allow
    if (allow) {
        const { user, channel, guild } = allow;
        if ((channel && mixedIncludes(channel, channelId)) ||
            (user && mixedIncludes(user, authorId)) ||
            (guild && guildId && mixedIncludes(guild, guildId)))
            return true;
    }
    // if an allowOnly constraint exists, and it's not met, block
    if (allowOnly) {
        const { user, channel, guild } = allowOnly;
        if ((channel && !mixedIncludes(channel, channelId)) ||
            (user && !mixedIncludes(user, authorId)) ||
            (guild && (!guildId || !mixedIncludes(guild, guildId))))
            return false;
    }
    // if a block constraint exists, and it's met, block
    if (block) {
        const { user, channel, guild } = block;
        if ((channel && mixedIncludes(channel, channelId)) ||
            (user && mixedIncludes(user, authorId)) ||
            (guild && guildId && mixedIncludes(guild, guildId)))
            return false;
    }
    return true;
}
// given a message, see if it matches a trigger, then run the corresponding function
async function routeTrigger(msg) {
    let foundTrigger = triggers.find((t) => t.trigger.test(msg.content));
    if (foundTrigger) {
        let { response } = foundTrigger;
        if (!meetsConstraints(msg, foundTrigger)) {
            console.log(`constraints suppressed a response to ${msg.author.username} requesting ${foundTrigger.trigger.source}`);
            return;
        }
        if (typeof response === "function")
            response = (await response({ msg, content: msg.content })) || "";
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
function enforceWellStructuredCommand(command) {
    if (typeof command === "string" ||
        (Array.isArray(command) && command.every((s) => typeof s === "string")))
        return;
    throw new Error(`bad command submitted:\n${command}`);
}
function enforceWellStructuredResponse(response) {
    if (typeof response !== "undefined")
        return;
    throw new Error(`bad response submitted:\n${response}`);
}
function enforceWellStructuredTrigger(trigger) {
    if (trigger instanceof RegExp)
        return;
    throw new Error(`bad trigger submitted:\n${trigger}`);
}
function mixedIncludes(haystack, needle) {
    return typeof haystack === "string"
        ? haystack === needle
        : haystack.includes(needle);
}
