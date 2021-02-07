//
// delayed resolvers
//
import { arrayify } from "one-stone/array";
export function buildReactionFilter({ users, notUsers, emoji, notEmoji, }) {
    users = users ? arrayify(users) : undefined;
    notUsers = notUsers ? arrayify(notUsers) : undefined;
    emoji = emoji ? arrayify(emoji) : undefined;
    notEmoji = notEmoji ? arrayify(notEmoji) : undefined;
    return (reaction, user) => {
        var _a, _b;
        return ((!users || users.includes(user.id)) &&
            (!notUsers || !notUsers.includes(user.id)) &&
            (!emoji || emoji.includes(reaction.emoji.name) || emoji.includes((_a = reaction.emoji.id) !== null && _a !== void 0 ? _a : "")) &&
            (!notEmoji ||
                (!notEmoji.includes(reaction.emoji.name) && !notEmoji.includes((_b = reaction.emoji.id) !== null && _b !== void 0 ? _b : ""))));
    };
}
/** try to do whatever func wants to do, but delete msg if there's an error */
export async function bugOut(msg, func) {
    try {
        return await func();
    }
    catch (e) {
        await delMsg(msg);
        throw e;
    }
}
export function normalizeID(resolvable) {
    return typeof resolvable === "string" ? resolvable : resolvable.id;
}
export async function delMsg(msg) {
    try {
        (msg === null || msg === void 0 ? void 0 : msg.deletable) && !msg.deleted && (await msg.delete());
    }
    catch (e) {
        console.log(e);
    }
    return;
}
