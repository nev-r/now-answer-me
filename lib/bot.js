import Discord from "discord.js";
import { makeTrashable } from "./util.js";
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
        routeMessage(msg);
        // match command
        // const isCommand = prefixCheck(msg.content);
        // // if (isCommand) {
        //   const routed = await routeMessage(
        //     msg,
        //     isCommand.groups!.command,
        //     isCommand.groups!.args
        //   );
        // if (routed) return;
        // done if routed successfully.
        // }
        // otherwise, check for a trigger
        // routeTrigger(msg);
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
// interface Constraints {
//   [constraintType: ConstraintTypes]:string | string[];
//   // user?: string | string[];
//   // channel?: string | string[];
//   // guild?: string | string[];
// }
// interface ConstraintCategories {
//   require?: Constraints;
//   block?: Constraints;
//   allow?: Constraints;
// }
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
// // given a command string, find and run the appropriate function
// async function routeCommand(
//   msg: Discord.Message,
//   command: string,
//   args?: string
// ) {
//   let foundCommand = commands.find((r) => mixedIncludes(r.command, command));
//   if (foundCommand) {
//     let { response, trashable } = foundCommand;
//     if (!meetsConstraints(msg, foundCommand)) {
//       console.log(
//         `constraints suppressed a response to ${msg.author.username} requesting ${command}`
//       );
//       return;
//     }
//     if (typeof response === "function")
//       response =
//         (await response({ msg, command, args, content: msg.content })) || "";
//     try {
//       if (response) {
//         const sentMessage = await msg.channel.send(response);
//         if (trashable)
//           makeTrashable(
//             sentMessage,
//             trashable === "requestor" ? msg.author.id : undefined
//           );
//       }
//     } catch (e) {
//       console.log(e);
//     }
//     // let upstream know we successfully found a route
//     return true;
//   }
// }
// given a command string, find and run the appropriate function
async function routeMessage(msg
// command: string,
// args?: string
) {
    var _a, _b, _c, _d, _e;
    const commandMatch = prefixCheck(msg.content);
    let foundRoute = (commandMatch &&
        commands.find((r) => mixedIncludes(r.command, commandMatch.groups.command))) ||
        triggers.find((t) => t.trigger.test(msg.content));
    if (foundRoute) {
        let { response, trashable } = foundRoute;
        if (!meetsConstraints(msg, foundRoute)) {
            console.log(`constraints suppressed a response to ${msg.author.username} requesting ${(_a = foundRoute.command) !== null && _a !== void 0 ? _a : foundRoute.trigger.source}`);
            return;
        }
        if (typeof response === "function")
            response =
                (await response({
                    msg,
                    command: (_c = (_b = commandMatch === null || commandMatch === void 0 ? void 0 : commandMatch.groups) === null || _b === void 0 ? void 0 : _b.command) !== null && _c !== void 0 ? _c : "",
                    args: (_e = (_d = commandMatch === null || commandMatch === void 0 ? void 0 : commandMatch.groups) === null || _d === void 0 ? void 0 : _d.args) !== null && _e !== void 0 ? _e : "",
                    content: msg.content,
                })) || "";
        try {
            if (response) {
                const sentMessage = await msg.channel.send(response);
                if (trashable)
                    makeTrashable(sentMessage, trashable === "requestor" ? msg.author.id : undefined);
            }
        }
        catch (e) {
            console.log(e);
        }
        // // let upstream know we successfully found a route
        // return true;
    }
}
function meetsConstraints(msg, { allowChannel, allowGuild, allowUser, blockChannel, blockGuild, blockUser, requireChannel, requireGuild, requireUser, }) {
    const { author: { id: authorId }, channel: { id: channelId }, guild: msgGuild, } = msg;
    const guildId = msgGuild === null || msgGuild === void 0 ? void 0 : msgGuild.id;
    // if an allow constraint exists, and it's met, allow
    if ((allowChannel && mixedIncludes(allowChannel, channelId)) ||
        (allowUser && mixedIncludes(allowUser, authorId)) ||
        (allowGuild && guildId && mixedIncludes(allowGuild, guildId)))
        return true;
    // if a block constraint exists, and it's met, block
    if ((blockChannel && mixedIncludes(blockChannel, channelId)) ||
        (blockUser && mixedIncludes(blockUser, authorId)) ||
        (blockGuild && guildId && mixedIncludes(blockGuild, guildId)))
        return false;
    // if a require constraint exists, and it's not met, block
    if ((requireChannel && !mixedIncludes(requireChannel, channelId)) ||
        (requireUser && !mixedIncludes(requireUser, authorId)) ||
        (requireGuild && (!guildId || !mixedIncludes(requireGuild, guildId))))
        return false;
    return true;
}
// function meetsConstraints(
//   msg: Discord.Message,
//   { require, allow, block }: ConstraintCategories
// ) {
//   const {
//     author: { id: authorId },
//     channel: { id: channelId },
//     guild,
//   } = msg;
//   const guildId = guild?.id;
//   // if an allow constraint exists, and it's met, allow
//   if (allow) {
//     const { user, channel, guild } = allow;
//     if (
//       (channel && mixedIncludes(channel, channelId)) ||
//       (user && mixedIncludes(user, authorId)) ||
//       (guild && guildId && mixedIncludes(guild, guildId))
//     )
//       return true;
//   }
//   // if a block constraint exists, and it's met, block
//   if (block) {
//     const { user, channel, guild } = block;
//     if (
//       (channel && mixedIncludes(channel, channelId)) ||
//       (user && mixedIncludes(user, authorId)) ||
//       (guild && guildId && mixedIncludes(guild, guildId))
//     )
//       return false;
//   }
//   // if an require constraint exists, and it's not met, block
//   if (require) {
//     const { user, channel, guild } = require;
//     if (
//       (channel && !mixedIncludes(channel, channelId)) ||
//       (user && !mixedIncludes(user, authorId)) ||
//       (guild && (!guildId || !mixedIncludes(guild, guildId)))
//     )
//       return false;
//   }
//   return true;
// }
// given a message, see if it matches a trigger, then run the corresponding function
// async function routeTrigger(msg: Discord.Message) {
//   let foundTrigger = triggers.find((t) => t.trigger.test(msg.content));
//   if (foundTrigger) {
//     let { response } = foundTrigger;
//     if (!meetsConstraints(msg, foundTrigger)) {
//       console.log(
//         `constraints suppressed a response to ${msg.author.username} requesting ${foundTrigger.trigger.source}`
//       );
//       return;
//     }
//     if (typeof response === "function")
//       response = (await response({ msg, content: msg.content })) || "";
//     try {
//       response && msg.channel.send(response);
//     } catch (e) {
//       console.log(e);
//     }
//   }
// }
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
