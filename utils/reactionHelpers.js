import { arrayify } from "one-stone/array";
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
export async function consumeReaction(...params) {
    var _a, _b;
    var _c;
    (_a = (_c = params[0]).awaitOptions) !== null && _a !== void 0 ? _a : (_c.awaitOptions = { max: 1, time: 60000 });
    params[0].awaitOptions.max = 1;
    return (_b = (await consumeReactions(...params))) === null || _b === void 0 ? void 0 : _b.first();
}
/**
 * consume reactions by deleting valid ones as they come in,
 * and return the collected reactions in standard awaitReactions format
 */
export async function consumeReactions({ msg, constraints = {}, awaitOptions = { max: 3, time: 60000 }, cancelCondition = () => false, }) {
    var _a;
    // forces the bot to be ignored
    constraints.notUsers = [...arrayify((_a = constraints.notUsers) !== null && _a !== void 0 ? _a : []), msg.client.user];
    const reactionFilterConditions = buildReactionFilter(constraints);
    // add cancelCondition to the reaction filter, & allow it to veto before any other checking
    const reactionFilter = (..._) => !cancelCondition() && reactionFilterConditions(..._);
    // a promise that behaves sort of like msg.awaitReactions,
    // but also deletes incoming reactions, if they passed the filter (on "collect")
    return new Promise((resolve) => {
        const collector = msg.createReactionCollector(reactionFilter, awaitOptions);
        collector.on("collect", (reaction, user) => reaction.users.remove(user));
        collector.once("end", (reactions) => resolve(reactions.size ? reactions : undefined));
    });
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
