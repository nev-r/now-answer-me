import { Message } from "discord.js";
import { makeTrashable } from "../utils/message-actions.js";
import { enforceWellStructuredCommand, enforceWellStructuredResponse, enforceWellStructuredTrigger, escapeRegExp, mixedIncludes, meetsConstraints, } from "./checkers.js";
import { sleep } from "one-stone/promise";
import { delMsg, sendableToMessageOptions } from "../utils/misc.js";
import { client } from "./index.js";
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
export async function routeMessageCommand(msg) {
    var _a, _b, _c, _d, _e, _f;
    const commandMatch = prefixCheck(msg.content);
    let foundRoute = (commandMatch &&
        commands.find((r) => mixedIncludes(r.command, commandMatch.groups.command))) ||
        triggers.find((t) => t.trigger.test(msg.content));
    if (foundRoute) {
        let { response: responseGenerator, trashable, selfDestructSeconds, reportViaReaction, } = foundRoute;
        if (!meetsConstraints(msg, foundRoute)) {
            console.log(`constraints suppressed a response to ${msg.author.username} requesting ${(_a = foundRoute.command) !== null && _a !== void 0 ? _a : foundRoute.trigger.source}`);
            return;
        }
        try {
            let results;
            if (typeof responseGenerator === "function") {
                const { guild, channel, author: user } = msg;
                results =
                    (await responseGenerator({
                        msg,
                        command: (_c = (_b = commandMatch === null || commandMatch === void 0 ? void 0 : commandMatch.groups) === null || _b === void 0 ? void 0 : _b.command) !== null && _c !== void 0 ? _c : "",
                        args: (_f = (_e = (_d = commandMatch === null || commandMatch === void 0 ? void 0 : commandMatch.groups) === null || _d === void 0 ? void 0 : _d.args) === null || _e === void 0 ? void 0 : _e.trim()) !== null && _f !== void 0 ? _f : "",
                        content: msg.content.trim(),
                        channel,
                        guild,
                        user,
                    })) || "";
            }
            else {
                results = responseGenerator;
            }
            if (reportViaReaction) {
                let reactionEmoji;
                if (typeof results === "string")
                    reactionEmoji = getReactionEmojiFromString(results);
                if (!reactionEmoji) {
                    reactionEmoji = results === false ? "🚫" : "☑";
                }
                await msg.react(reactionEmoji);
                return;
            }
            if (results) {
                let sentMessage;
                // if the command already sent and returned a message
                if (results instanceof Message)
                    sentMessage = results;
                else {
                    sentMessage = await msg.channel.send(sendableToMessageOptions(results));
                }
                if (sentMessage) {
                    if (trashable)
                        makeTrashable(sentMessage, trashable === "requestor" ? msg.author.id : undefined);
                    if (selfDestructSeconds) {
                        sleep(selfDestructSeconds * 1000).then(() => delMsg(sentMessage));
                    }
                }
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
function getReactionEmojiFromString(str) {
    var _a;
    // string manip
    str = str.replace(/\uFE0F|\u20E3/g, "");
    if ([...str].length === 1) {
        if (/^[\d*#]$/.test(str))
            return str + "\uFE0F\u20E3";
        if (/^\p{Emoji}$/u.test(str))
            return str;
    }
    const matched = str.match(/^<a?:(\w+):(?<snowflake>\d+)>$/);
    if ((_a = matched === null || matched === void 0 ? void 0 : matched.groups) === null || _a === void 0 ? void 0 : _a.snowflake)
        str = matched.groups.snowflake;
    // try resolving
    const resolved = client.emojis.resolve(str);
    if (resolved)
        return resolved.id;
}
