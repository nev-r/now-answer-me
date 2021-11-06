import { MessageEmbed, } from "discord.js";
import { arrayify } from "one-stone/array";
import { sleep } from "one-stone/promise";
import { serialReactions } from "./message-actions.js";
import { boolFilter, delMsg, sendableToMessageOptions } from "./misc.js";
import { _consumeReaction_, } from "./reactionHelpers.js";
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
        promptMessage = await channel.send(sendableToMessageOptions(promptContent));
    }
    try {
        const choiceMessage = (await channel.awaitMessages({
            filter: (m) => {
                if (users && !users.includes(m.author.id))
                    return false;
                return optionFilter(m.content);
            },
            ...awaitOptions,
        })).first();
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
 * and awaits a selection (someone clicking one)
 *
 * returns which emoji was selected, or undefined if it timed out waiting
 *
 * cleanupReactions controls whether to remove
 *
 * aborting this prevents reaction cleanup and returns undefined
 */
export async function presentOptions({ msg, options, deleteAfter = true, cleanupReactions = deleteAfter ? false : true, waitTime = 60000, }) {
    const awaitOptions = { max: 1, time: waitTime };
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
    const serialReactionsAbortController = { abort: false };
    const applyingReactions = serialReactions(msg, options_, serialReactionsAbortController).then(() => sleep(800));
    // if we're deleting the message anyway, treat the message as already gone,
    // so _consumeReaction_ won't bother to try and clean up
    const consumerController = {
        messageGone: deleteAfter ? true : false,
        consumptionOk: applyingReactions,
    };
    try {
        const { collectedReaction: cR } = _consumeReaction_({
            msg,
            constraints: { emoji: boolFilter(optionsMeta.flatMap((o) => [o.id, o.name])) },
            awaitOptions,
            controller: consumerController,
        });
        const collectedReaction = await cR;
        // the moment reaction watcher finishes, make sure reaction applyer knows to stop
        serialReactionsAbortController.abort = true;
        if (deleteAfter) {
            // notify collector not to try deleting any more reactions because we're dumping the entire message
            consumerController.messageGone = true;
            delMsg(msg);
        }
        // we timed out instead of getting a valid reaction
        if (!collectedReaction || cleanupReactions) {
            if (!deleteAfter && !msg.deleted)
                applyingReactions.then(() => {
                    if (!msg.reactions.cache.size)
                        return;
                    console.log("cleanup");
                    msg.reactions.removeAll();
                });
            if (!collectedReaction)
                return undefined;
        }
        const result = collectedReaction.emoji;
        return optionsMeta.find((o) => o.name === result.name || (result.id && o.id && result.id === o.id))?.option;
    }
    catch (e) {
        console.log(e);
        return undefined;
    }
}
