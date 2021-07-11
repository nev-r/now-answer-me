import { Client, } from "discord.js";
import { Message } from "discord.js";
import { makeTrashable } from "../utils/message-actions.js";
import { enforceWellStructuredCommand, enforceWellStructuredResponse, enforceWellStructuredTrigger, escapeRegExp, mixedIncludes, meetsConstraints, } from "./checkers.js";
import { sleep } from "one-stone/promise";
import { delMsg, sendableToMessageOptions } from "../utils/misc.js";
import { arrayify } from "one-stone/array";
export const startupTimestamp = new Date();
export const client = new Client({
    intents: [
        "GUILDS",
        "GUILD_MESSAGES",
        "DIRECT_MESSAGES",
        "DIRECT_MESSAGE_REACTIONS",
        "GUILD_EMOJIS",
        "GUILD_MESSAGE_REACTIONS",
    ],
});
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
        if (doIgnoreDMs && msg.channel.type === "dm")
            return;
        if (messageFilters.some((f) => f(msg) === false))
            return;
        routeMessageCommand(msg);
    })
        .on("interactionCreate", async (interaction) => {
        if (interaction.isCommand()) {
            routeSlashCommand(interaction);
        }
        else if (interaction.isButton()) {
            interaction.update({
                content: (parseFloat(interaction.message.content) + (interaction.customId === "abc" ? -1 : 1)).toString(),
            });
        }
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
const slashCommands = {};
export function addSlashCommand(command) {
    if (hasConnected) {
        registerSlashCommand(command.where, command.config);
    }
    slashCommands[command.config.name] = command;
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
async function routeMessageCommand(msg) {
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
// given a command string, find and run the appropriate function
async function routeSlashCommand(interaction) {
    const slashCommand = slashCommands[interaction.commandName];
    if (!slashCommand) {
        console.log(`unrecognized slash command received: ${interaction.commandName}`);
        return;
    }
    let { handler, ephemeral, defer, deferIfLong } = slashCommand;
    let deferalCountdown;
    if (defer || deferIfLong) {
        deferalCountdown = setTimeout(() => {
            interaction.defer({ ephemeral });
        }, defer ? 0 : 2300);
    }
    try {
        let results;
        if (typeof handler === "function") {
            const { guild, channel, user } = interaction;
            const optionDict = createDictFromOptions([...interaction.options.values()]);
            const optionList = Object.entries(optionDict);
            // const optionList = [
            // 	...interaction.options.map(
            // 		(o) => [o.name, o.value] as [string, CommandInteractionOption["value"]]
            // 	),
            // ];
            results =
                (await handler({
                    channel,
                    guild,
                    user,
                    optionList,
                    optionDict,
                })) || "";
        }
        else {
            results = handler;
        }
        deferalCountdown && clearTimeout(deferalCountdown);
        if (results && !interaction.replied) {
            await interaction.reply({ ...sendableToMessageOptions(results), ephemeral });
        }
    }
    catch (e) {
        await interaction.reply({ content: "⚠", ephemeral: true });
        console.log(e);
    }
    if (!interaction.replied)
        await interaction.reply({ content: "☑", ephemeral: true });
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
async function registerSlashCommand(where, config) {
    await clientReady;
    const commandLocation = where === "global" ? client.application : client.guilds.resolve(where);
    if (!commandLocation)
        throw `couldn't resolve ${where} to a guild`;
    // commandLocation.commands.cache('')
    console.log("pretending to register a command named", config.name);
    console.log("here:", commandLocation);
    console.log("command count:", commandLocation.commands.cache.size);
}
function createDictFromOptions(options, dict = {}) {
    var _a;
    for (const opt of options) {
        if (opt.type === "SUB_COMMAND" || opt.type === "SUB_COMMAND_GROUP")
            createDictFromOptions(opt.options ? [...opt.options.values()] : []);
        else {
            dict[opt.name] =
                opt.type === "CHANNEL"
                    ? opt.channel
                    : opt.type === "USER"
                        ? (_a = opt.member) !== null && _a !== void 0 ? _a : opt.user
                        : opt.type === "ROLE"
                            ? opt.role
                            : opt.type === "MENTIONABLE"
                                ? undefined
                                : opt.value;
        }
    }
    return dict;
}
