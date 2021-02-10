import { buildReactionFilter } from "../utils/misc.js";
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
    // holds a emoji+user combo string briefly, to de-duplicate reaction deletions
    // const removed = new Set<string>();
    const reactionFilter = buildReactionFilter(constraints !== null && constraints !== void 0 ? constraints : {});
    const collector = msg.createReactionCollector(reactionFilter, awaitOptions); //  awaitReactions(filter, options = {}) {
    return new Promise((resolve) => {
        collector.on("collect", (reaction, user) => {
            if (cancelCondition())
                return;
            if (!reactionFilter(reaction, user))
                return;
            // const identifier = `${reaction.emoji.name}${user.id}`;
            // if (removed.has(identifier)) return;
            // removed.add(identifier);
            reaction.users.remove(user);
            // setTimeout(() => removed.delete(identifier), 500);
        });
        collector.once("end", (reactions) => resolve(reactions.size ? reactions : undefined));
    });
}
// // checks for reactions we want
// // const reactionFilter = buildReactionFilter(constraints ?? {});
// // obeys the above filter, but as it's checking, removes the reactions
// const reactionFilterAndSaver: ReactionFilter = (reaction, user) => {
// 	if (!reactionFilter(reaction, user)) return false;
// 	const identifier = `${reaction.emoji.name}${user.id}`;
// 	if (!removed.has(identifier)) {
// 		removed.add(identifier);
// 		reaction.users.remove(user);
// 		setTimeout(() => removed.delete(identifier), 500);
// 	}
// 	return true;
// };
// const reactionCollection = await msg.awaitReactions(reactionFilterAndSaver, awaitOptions);
// if (!reactionCollection.size) return;
// return reactionCollection;
// }
