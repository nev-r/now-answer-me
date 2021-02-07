import { MessageEmbed, } from "discord.js";
import { arrayify } from "one-stone/array";
import { sleep } from "one-stone/promise";
import { serialReactions } from "./message-actions.js";
import { buildReactionFilter, delMsg, normalizeID } from "./misc.js";
/** wip */
export async function promptForText({ channel, options, user, swallowResponse = true, awaitOptions = { max: 1, time: 120000 }, promptContent, }) {
    // if users exists, force it to be an array of IDs
    const users = user ? arrayify(user).map((u) => normalizeID(u)) : undefined;
    const optionFilter = Array.isArray(options)
        ? (s) => options.includes(s)
        : (s) => options.test(s);
    const optionOutput = Array.isArray(options)
        ? // a string was determined to be an exact match, so return it as-is
            (s) => s
        : // we can assume exec succeeds because options.test found a match in optionFilter
            (s) => options.exec(s)[0];
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
 */
export async function presentOptions(msg, options, cleanupReactions = "all", awaitOptions = { max: 1, time: 60000 }) {
    var _a, _b, _c;
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
    await serialReactions(msg, options_);
    try {
        const reactionFilter = buildReactionFilter({
            notUsers: (_a = msg.client.user) === null || _a === void 0 ? void 0 : _a.id,
            emoji: optionsMeta.flatMap((o) => [o.id, o.name]).filter(Boolean),
        });
        const reactionCollection = await msg.awaitReactions(reactionFilter, awaitOptions);
        // we timed out instead of getting a valid reaction
        if (!reactionCollection.size) {
            if (!msg.deleted)
                await msg.reactions.removeAll();
            return undefined;
        }
        switch (cleanupReactions) {
            case "others": {
                const reactionBundles = [...reactionCollection.values()];
                for (const reactionBundle of reactionBundles) {
                    const reactingUsers = [...reactionBundle.users.cache.values()].filter((user) => { var _a; return user.id !== ((_a = msg.client.user) === null || _a === void 0 ? void 0 : _a.id); });
                    for (const reactingUser of reactingUsers) {
                        console.log(`removing [${reactionBundle.emoji.identifier}][${reactionBundle.emoji.name}] from [${reactingUser.username}]`);
                        await reactionBundle.users.remove(reactingUser);
                        await sleep(800);
                    }
                }
                break;
            }
            default:
                if (!msg.deleted)
                    await msg.reactions.removeAll();
                await sleep(800);
                break;
        }
        const result = (_b = reactionCollection.first()) === null || _b === void 0 ? void 0 : _b.emoji;
        if (!result)
            return;
        return (_c = optionsMeta.find((o) => o.name === result.name || (result.id && o.id && result.id === o.id))) === null || _c === void 0 ? void 0 : _c.option;
    }
    catch (e) {
        return undefined;
    }
}
