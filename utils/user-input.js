import { MessageEmbed, } from "discord.js";
import { arrayify } from "one-stone/array";
import { sleep } from "one-stone/promise";
import { serialReactions } from "./message-actions.js";
import { delMsg } from "./misc.js";
import { consumeReaction } from "./reactionHelpers.js";
import { normalizeID } from "./data-normalization.js";
/** wip */
export async function promptForText({ channel, options, user, swallowResponse = true, awaitOptions = { max: 1, time: 120000 }, promptContent, }) {
    // if users exists, force it to be an array of IDs
    const users = user ? arrayify(user).map((u) => normalizeID(u)) : undefined;
    const validOptions = typeof options === "string" ? [options] : options;
    const optionFilter = Array.isArray(validOptions)
        ? (s) => validOptions.includes(s)
        : (s) => validOptions.test(s);
    const optionOutput = Array.isArray(validOptions)
        ? // a string was determined to be an exact match, so return it as-is
            (s) => s
        : // we can assume exec succeeds because by the time we reach optionOutput,
            // .test already found a match inside optionFilter
            (s) => validOptions.exec(s)[0];
    let promptMessage;
    if (promptContent) {
        if (typeof promptContent === "string")
            promptContent = new MessageEmbed({ description: promptContent });
        promptMessage = await channel.send(promptContent);
    }
    try {
        const choiceMessage = (await channel.awaitMessages((m) => {
            if (users && !users.includes(m.author.id))
                return false;
            return optionFilter(m.content);
        }, awaitOptions)).first();
        if (choiceMessage) {
            swallowResponse && (await delMsg(choiceMessage));
            return {
                text: optionOutput(choiceMessage.content),
                message: choiceMessage,
            };
        }
    }
    finally {
        // always cleanup the prompt if one was sent and it isn't deleted
        await delMsg(promptMessage);
    }
}
/**
 * posts 1 or more options (emoji) to a message,
 * and awaits a selection (someone clicking one, thereby increasing the count)
 *
 * returns which emoji was selected, or undefined if it timed out waiting
 *
 * cleanupReactions controls whose reactions to clean up after a choice is made
 *
 * aborting this prevents reaction cleanup and returns undefined
 */
export async function presentOptions(msg, options, cleanupReactions = true, awaitOptions = { max: 1, time: 60000 }) {
    var _a;
    const options_ = arrayify(options);
    const optionsMeta = options_.map((o) => {
        const resolved = msg.client.emojis.resolve(o);
        if (resolved)
            return { option: o, name: resolved.name, id: resolved.id };
        const matched = o.match(/^<a?:(\w+):(\d+)>$/);
        if (matched)
            return { option: o, name: matched[1], id: matched[2] };
        return { option: o, name: o };
    });
    const applying = serialReactions(msg, options_).then(() => sleep(800));
    try {
        const capturedReaction = await consumeReaction({
            msg,
            constraints: { emoji: optionsMeta.flatMap((o) => [o.id, o.name]).filter(Boolean) },
            awaitOptions,
        });
        // we timed out instead of getting a valid reaction
        if (!capturedReaction || cleanupReactions) {
            if (!msg.deleted)
                applying.then(() => {
                    if (!msg.reactions.cache.size)
                        return;
                    console.log("cleanup");
                    msg.reactions.removeAll();
                });
            if (!capturedReaction)
                return undefined;
        }
        const result = capturedReaction.emoji;
        return (_a = optionsMeta.find((o) => o.name === result.name || (result.id && o.id && result.id === o.id))) === null || _a === void 0 ? void 0 : _a.option;
    }
    catch (e) {
        return undefined;
    }
}
