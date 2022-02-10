//
// additional things you can do to an existing message
//
import { arrayify } from "one-stone/array";
import { sleep } from "one-stone/promise";
import { delMsg } from "./misc.js";
/**
 * deletes msg if someone reacts to it with any of
 * wastebasket `🗑`, litter `🚮`, or cancel `🚫`
 *
 * you can directly wrap a d.js send() or its results in this
 */
export async function makeTrashable(msg, whoCanDelete) {
    msg = await msg;
    if (!msg)
        return;
    let reactionFilter = (reaction) => trashEmojis.includes(reaction.emoji.name);
    if (whoCanDelete) {
        const peopleList = arrayify(whoCanDelete);
        reactionFilter = (reaction, user) => trashEmojis.includes(reaction.emoji.name) && peopleList.includes(user.id);
    }
    const userReactions = await msg.awaitReactions({
        filter: reactionFilter,
        max: 1,
        time: 300000,
    });
    if (userReactions.size)
        await delMsg(msg);
}
const trashEmojis = ["🚮", "🗑️", "🚫"];
/**
 * apply `reactions` to `msg`, in a set order, without complaining about errors
 */
export async function serialReactions(msg, reactions, abortController = { abort: false }) {
    for (const reaction of reactions) {
        !abortController.abort && (await singleReaction(msg, reaction));
    }
}
/**
 * apply `reaction` to `msg`, without complaining about errors
 */
export async function singleReaction(msg, reaction, abortController = { abort: false }) {
    try {
        if (!abortController.abort && !msg.reactions.cache.get(reaction)?.me) {
            await msg.react(reaction);
            await sleep(800); // apparently discord rate limited this
        }
    }
    catch (e) {
        console.log(e);
    }
}
// function nodeLog(
//   any: Parameters<typeof process.stdout.write>[0]
// ): (_e: any) => void {
//   return (_e) => {
//     process.stdout.write(any);
//   };
// }
