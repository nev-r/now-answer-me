import { Message } from "discord.js";
import type {
	CommandResponse,
	Constraints,
	Extras,
	Sendable,
	TriggerResponse,
} from "../types/types-bot.js";
import { makeTrashable } from "../utils/message-actions.js";
import {
	enforceWellStructuredCommand,
	enforceWellStructuredResponse,
	enforceWellStructuredTrigger,
	escapeRegExp,
	mixedIncludes,
	meetsConstraints,
} from "./checkers.js";
import { sleep } from "one-stone/promise";
import { delMsg, sendableToMessageOptions } from "../utils/misc.js";
import { client } from "./index.js";

let prefixCheck: (s: string) => ReturnType<string["match"]>;

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
export function setPrefix(prefix: string | RegExp) {
	if (typeof prefix === "string") {
		const newRegex = new RegExp(
			`^(${escapeRegExp(prefix).replace(/^\^+/, "")})(?<command>\\S*)(?: (?<args>.+))?$`
		);
		prefixCheck = (s) => (s.startsWith(prefix) ? s.match(newRegex) : null);
	} else {
		prefixCheck = (s) => s.match(prefix);
	}
}
setPrefix("!");

const commands: ({
	command: string | string[];
	response: CommandResponse;
} & Constraints &
	Extras)[] = [];

/**
 * either a Sendable, or a function that generates a Sendable.
 * if it's a function, it's passed the TriggerParams object
 */
export function addCommand(...commands_: typeof commands) {
	commands_.forEach((c) => {
		enforceWellStructuredCommand(c.command);
		enforceWellStructuredResponse(c.response);
	});
	commands.push(...commands_);
}

const triggers: ({
	trigger: RegExp;
	response: TriggerResponse;
} & Constraints &
	Extras)[] = [];

/**
 * either a Sendable, or a function that generates a Sendable.
 * if it's a function, it's passed the TriggerParams object
 */
export function addTrigger(...triggers_: typeof triggers) {
	triggers_.forEach((t) => {
		enforceWellStructuredTrigger(t.trigger);
		enforceWellStructuredResponse(t.response);
	});
	triggers.push(...triggers_);
}

// given a command string, find and run the appropriate function
export async function routeMessageCommand(msg: Message) {
	const commandMatch = prefixCheck(msg.content);
	let foundRoute =
		(commandMatch &&
			commands.find((r) => mixedIncludes(r.command, commandMatch.groups!.command))) ||
		triggers.find((t) => t.trigger.test(msg.content));

	if (foundRoute) {
		let {
			response: responseGenerator,
			trashable,
			selfDestructSeconds,
			reportViaReaction,
		} = foundRoute;
		if (!meetsConstraints(msg, foundRoute)) {
			console.log(
				`constraints suppressed a response to ${msg.author.username} requesting ${
					(foundRoute as any).command ?? (foundRoute as any).trigger.source
				}`
			);
			return;
		}

		try {
			let results: Sendable | Message | undefined;
			if (typeof responseGenerator === "function") {
				const { guild, channel, author: user } = msg;
				results =
					(await responseGenerator({
						msg,
						command: commandMatch?.groups?.command ?? "",
						args: commandMatch?.groups?.args?.trim() ?? "",
						content: msg.content.trim(),
						channel,
						guild,
						user,
					})) || "";
			} else {
				results = responseGenerator;
			}
			if (reportViaReaction) {
				let reactionEmoji: string | undefined;
				if (typeof results === "string") reactionEmoji = getReactionEmojiFromString(results);
				if (!reactionEmoji) {
					reactionEmoji = results === false ? "🚫" : "☑";
				}
				await msg.react(reactionEmoji);
				return;
			}
			if (results) {
				let sentMessage: Message | undefined;
				// if the command already sent and returned a message
				if (results instanceof Message) sentMessage = results;
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
		} catch (e) {
			if (reportViaReaction) {
				await msg.react("⚠");
			}
			console.log(e);
		}
	}
}

function getReactionEmojiFromString(str: string) {
	// string manip
	str = str.replace(/\uFE0F|\u20E3/g, "");
	if ([...str].length === 1) {
		if (/^[\d*#]$/.test(str)) return str + "\uFE0F\u20E3";
		if (/^\p{Emoji}$/u.test(str)) return str;
	}

	const matched = str.match(/^<a?:(\w+):(?<snowflake>\d+)>$/);
	if (matched?.groups?.snowflake) str = matched.groups.snowflake;

	// try resolving
	const resolved = client.emojis.resolve(str as `${bigint}`);
	if (resolved) return resolved.id;
}
