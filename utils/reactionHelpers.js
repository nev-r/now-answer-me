import { arrayify } from "one-stone/array";
import { sleep } from "one-stone/promise";
import { normalizeID, normalizeName } from "./data-normalization.js";
/**
 * listens for, consumes, and yields one reaction at a time,
 * matching collectorParams.constraints, returning nothing when exhausted
 */
export async function* serialReactionMonitor({ limit, ...collectorParams }) {
    let i = 0;
    while (!limit || i++ < limit) {
        const reaction = await consumeReaction(collectorParams);
        if (!reaction)
            return;
        yield reaction;
    }
}
/**
 * "consume" a single reaction by deleting reactions as they come in,
 * and returning the reaction once a match is found
 */
export async function consumeReaction(__) {
    return _consumeReaction_(__).collectedReaction;
}
/** like `consumeReaction` but accepts a `controller` param and returns an endEarly */
export function _consumeReaction_(__) {
    var _a;
    (_a = __.awaitOptions) !== null && _a !== void 0 ? _a : (__.awaitOptions = { max: 1, time: 60000 });
    __.awaitOptions.max = 1;
    const { collectedReactions, endEarly } = _consumeReactions_(__);
    return {
        endEarly,
        collectedReaction: collectedReactions.then((cr) => cr === null || cr === void 0 ? void 0 : cr.first()),
    };
}
/**
 * consume reactions by deleting valid ones as they come in,
 * and return the collected reactions in standard awaitReactions format
 */
export async function consumeReactions(__) {
    return _consumeReactions_(__).collectedReactions;
}
/** like `consumeReactions` but accepts a `controller` param and returns an endEarly */
export function _consumeReactions_({ msg, constraints = {}, awaitOptions = { max: 3, time: 60000 }, controller = { messageGone: false, consumptionOk: Promise.resolve() }, }) {
    var _a;
    // queue holding reaction deletions.
    // we can only process 1 per... whatever, because heavy rate limiting
    const reactionDeletions = [];
    // forces the bot to ignore its own reactions
    constraints.notUsers = [...arrayify((_a = constraints.notUsers) !== null && _a !== void 0 ? _a : []), msg.client.user];
    const reactionFilterConditions = buildReactionFilter(constraints);
    // if it's been told to give up, reactionFilter will say yes to any reaction,
    // but meawhile consumeReactions will resolve undefined
    const reactionFilter = (..._) => {
        if (controller.messageGone) {
            return true;
        }
        return reactionFilterConditions(..._);
    };
    const collector = msg.createReactionCollector(reactionFilter, awaitOptions);
    collector.on("collect", async (reaction, user) => {
        // a valid reaction was received. this is just the cleanup function so abort if no message
        if (msg.deleted || controller.messageGone)
            return;
        // make sure upstream has cleared us for reaction deletion, so we don't hit rate limits
        await controller.consumptionOk;
        // await the current queue of deletions
        await Promise.allSettled(reactionDeletions);
        // and push a new promise into it
        reactionDeletions.push(reaction.users.remove(user).then(() => sleep(800)));
    });
    return {
        endEarly: () => {
            collector.stop();
        },
        collectedReactions: new Promise((resolve) => {
            collector.once("end", (reactions) => resolve(reactions.size ? reactions : undefined));
        }),
    };
}
export function buildReactionFilter({ users, notUsers, emoji, notEmoji, }) {
    const userIDs = users ? arrayify(users).map(normalizeID) : undefined;
    const notUsersIDs = notUsers ? arrayify(notUsers).map(normalizeID) : undefined;
    const emojiNamesIDs = emoji
        ? arrayify(emoji)
            .flatMap((e) => [normalizeName(e), typeof e === "string" ? "" : e.id])
            .filter(Boolean)
        : undefined;
    const notEmojiNamesIDs = notEmoji
        ? arrayify(notEmoji)
            .flatMap((e) => [normalizeName(e), typeof e === "string" ? "" : e.id])
            .filter(Boolean)
        : undefined;
    return (reaction, user) => {
        return (
        // no limits or a limit matches
        (!userIDs || userIDs.includes(user.id)) &&
            // no limits or no limits match
            (!notUsersIDs || !notUsersIDs.includes(user.id)) &&
            // no limits or a limit matches
            (!emojiNamesIDs ||
                emojiNamesIDs.includes(reaction.emoji.name) ||
                emojiNamesIDs.includes(reaction.emoji.id)) &&
            // no limits or no limits match
            (!notEmojiNamesIDs ||
                (!notEmojiNamesIDs.includes(reaction.emoji.name) &&
                    !notEmojiNamesIDs.includes(reaction.emoji.id))));
    };
}
