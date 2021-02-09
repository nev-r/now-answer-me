var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
import { buildReactionFilter } from "../utils/misc.js";
/**
 * listens for, consumes, and yields one reaction at a time,
 * matching collectorParams.constraints, returning nothing when exhausted
 */
export function serialReactionMonitor(_a) {
    var { limit } = _a, collectorParams = __rest(_a, ["limit"]);
    return __asyncGenerator(this, arguments, function* serialReactionMonitor_1() {
        let i = 0;
        while (!limit || i++ < limit) {
            const reaction = yield __await(consumeReaction(collectorParams));
            if (!reaction)
                return yield __await(void 0);
            yield yield __await(reaction);
        }
    });
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
export async function consumeReactions({ msg, constraints = {}, awaitOptions = { max: 3, time: 60000 }, }) {
    // holds a emoji+user combo string briefly, to de-duplicate reaction deletions
    const removed = new Set();
    // checks for reactions we want
    const reactionFilter = buildReactionFilter(constraints !== null && constraints !== void 0 ? constraints : {});
    // obeys the above filter, but as it's checking, removes the reactions
    const reactionFilterAndSaver = (reaction, user) => {
        if (!reactionFilter(reaction, user))
            return false;
        const identifier = `${reaction.emoji.name}${user.id}`;
        if (!removed.has(identifier)) {
            removed.add(identifier);
            reaction.users.remove(user);
            setTimeout(() => removed.delete(identifier), 500);
        }
        return true;
    };
    const reactionCollection = await msg.awaitReactions(reactionFilterAndSaver, awaitOptions);
    if (!reactionCollection.size)
        return;
    return reactionCollection;
}
