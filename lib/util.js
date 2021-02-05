import { MessageEmbed, } from "discord.js";
import { sleep } from "one-stone/promise";
import { client, clientReadyPromise } from "./bot.js";
import { buildEmojiDictUsingClient, uploadEmojiListUsingClient, } from "./raw-utils.js";
/**
 * accepts the results of a `channel.send`, `await channel.send` or wraps a `channel.send`
 *
 * deletes message if someone reacts with wastebasket `🗑`, litter `🚮`, or cancel `🚫`
 */
export async function makeTrashable(msg, whoCanDelete) {
    msg = await Promise.resolve(msg);
    if (!msg)
        return;
    let reactionFilter = (reaction) => trashEmojis.includes(reaction.emoji.name);
    if (whoCanDelete) {
        const peopleList = arrayify(whoCanDelete);
        reactionFilter = (reaction, user) => trashEmojis.includes(reaction.emoji.name) && peopleList.includes(user.id);
    }
    const userReactions = await msg.awaitReactions(reactionFilter, {
        max: 1,
        time: 300000,
    });
    if (userReactions.size)
        msg.delete();
}
const trashEmojis = ["🚮", "🗑️", "🚫"];
/**
 * accepts a channel to post to, a list of `T`s, and a function that turns a `T` into a valid `MessageEmbed`
 *
 * posts embeds serially until all have been shown, `🎲` advances to the next one
 */
export async function sendRerollableEmbed(channel, remainingList, renderer) {
    let rerollableMessage;
    while (remainingList.length) {
        const item = remainingList.pop();
        const embed = renderer(item);
        if (remainingList.length)
            embed.setFooter(`${remainingList.length} other results`);
        if (!rerollableMessage) {
            rerollableMessage = await channel.send(embed);
            makeTrashable(rerollableMessage);
        }
        else {
            rerollableMessage.edit(embed);
        }
        if (remainingList.length &&
            !(await presentOptions(rerollableMessage, "🎲", "others")))
            return;
    }
}
const adjustDirections = { "⬅️": -1, "➡️": 1 };
const directions = Object.keys(adjustDirections);
/**
 * accepts a channel to post to, a list of `T`s, and a function that turns a `T` into a valid `MessageEmbed`
 */
export async function sendPaginatedEmbed(channel, contentList, renderer) {
    let currentPage = 0;
    // death to the counterintuitive loop
    let embed = renderer(contentList[currentPage]);
    if (contentList.length > 1) {
        embed.setFooter(`${currentPage + 1} / ${contentList.length}`);
    }
    // always send the initial embed and always make it trashable
    const paginatedMessage = await channel.send(embed);
    makeTrashable(paginatedMessage);
    await bugOut(paginatedMessage, async () => {
        // if there's pages to switch between, enter a loop of listening for input
        if (contentList.length > 1) {
            let userInput;
            // wait to see if something is clicked
            while ((userInput = await presentOptions(paginatedMessage, directions, "all"))) {
                // adjust the page accordingly
                currentPage += adjustDirections[userInput];
                if (currentPage + 1 > contentList.length)
                    currentPage = 0;
                if (currentPage < 0)
                    currentPage = contentList.length - 1;
                // and update the message with the new embed
                embed = renderer(contentList[currentPage]);
                embed.setFooter(`${currentPage + 1} / ${contentList.length}`);
                await paginatedMessage.edit(embed);
            }
            // loop breaks when there's no more input.
            // let's remove the pagination footer and do one last edit
            embed.footer = null;
            await paginatedMessage.edit(embed);
        }
    });
}
/**
 * accepts a channel to post to, a list of `T`s, and a function that turns a `T` into a valid element of a `MessageEmbed` field
 */
export async function sendPaginatedSelector({ user, channel, contentList, optionRenderer = (l, i) => ({ name: i, value: `${l}`, inline: true }), resultRenderer = (l) => new MessageEmbed({ description: `${l}` }), prompt = "choose by responding with a number:", itemsPerPage = 25, }) {
    const numPages = Math.ceil(contentList.length / itemsPerPage);
    let currentPage = 0;
    // death to the counterintuitive loop!
    let embed = new MessageEmbed({
        fields: contentList
            .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
            .map((t, i) => optionRenderer(t, currentPage * itemsPerPage + i + 1)),
    });
    prompt && embed.setDescription(prompt);
    if (numPages > 1) {
        embed.setFooter(`${currentPage + 1} / ${numPages}`);
    }
    // always send the initial embed and always make it trashable
    const paginatedMessage = await channel.send(embed);
    makeTrashable(paginatedMessage);
    await bugOut(paginatedMessage, async () => {
        var _a;
        // this continually listens for a numeric choice
        const choiceDetector = (async () => {
            const choiceMessage = (await channel.awaitMessages((m) => {
                if (m.author.id !== user.id || !/^\d+$/.test(m.content))
                    return false;
                const index = Number(m.content);
                return index > 0 && index <= contentList.length;
            }, { max: 1, time: 120000 })).first();
            if (choiceMessage) {
                try {
                    await choiceMessage.delete();
                }
                catch (_a) {
                    console.log(`could not delete someone's numeric response`);
                }
                return Number(choiceMessage.content);
            }
        })();
        let userInput;
        // wait to see if something is clicked
        while ((userInput = await Promise.race([
            // if there's pages to switch between,
            ...(numPages > 1
                ? // include a page selector
                    [presentOptions(paginatedMessage, directions, "all")]
                : []),
            // if there's only 1 option,
            ...(contentList.length === 1
                ? // short circuit to it already being chosen
                    [Promise.resolve(1)]
                : []),
            choiceDetector,
        ]))) {
            if (typeof userInput === "string") {
                // adjust the page accordingly
                currentPage += (_a = adjustDirections[userInput]) !== null && _a !== void 0 ? _a : 0;
                if (currentPage + 1 > numPages)
                    currentPage = 0;
                if (currentPage < 0)
                    currentPage = numPages - 1;
                // and update the message with the new embed
                embed = new MessageEmbed({
                    fields: contentList
                        .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
                        .map((t, i) => optionRenderer(t, currentPage * itemsPerPage + i + 1)),
                });
                embed.setFooter(`${currentPage + 1} / ${numPages}`);
                await paginatedMessage.edit(embed);
                // and then just continue waiting for a new pagination input
            }
            else {
                // a message with a valid number was detected
                embed = resultRenderer(contentList[userInput - 1]);
                await paginatedMessage.edit(embed);
                // completely escape the loop, and avoid throwing the "timed out" error
                return;
            }
        }
        // loop breaks when there's no more input
        // (someone stopped paginating, or didn't make a choice)
        // we'll give up i guess. throwing will cause the cleanup
        // wrapper to delete the pagination message
        throw new Error("timed out waiting for pagination or selection");
    });
}
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
            swallowResponse &&
                choiceMessage.delete().catch(() => console.log("dysphagia"));
            return {
                text: optionOutput(choiceMessage.content),
                message: choiceMessage,
            };
        }
    }
    finally {
        // always cleanup the prompt if one was sent and it isn't deleted
        (promptMessage === null || promptMessage === void 0 ? void 0 : promptMessage.deleted) || (promptMessage === null || promptMessage === void 0 ? void 0 : promptMessage.delete().catch());
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
            return { option: o, name: matched[0], id: matched[1] };
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
/**
 * simple function to apply `reactions` to `msg` in a set order
 */
export async function serialReactions(msg, reactions) {
    // clockSince('about to dispatch all reactions');
    // console.log(`got this collection: ${reactions.map(r=>r[0]).join()}\nto apply to this message: ${msg}`);
    for (const reaction of reactions) {
        await singleReaction(msg, reaction);
    }
}
export async function singleReaction(msg, reaction) {
    var _a;
    try {
        // console.log(msg.reactions.cache);
        if (!((_a = msg.reactions.cache.get(reaction)) === null || _a === void 0 ? void 0 : _a.me)) {
            // console.log(
            //   `!!applying this selectable: ${reaction[0]} to this message: ${msg}`
            // );
            await msg.react(reaction);
            await sleep(800); // apparently discord rate limited this
        }
    }
    catch (e) {
        nodeLog(`${reaction[0]}≠>${msg}`);
    }
    // console.log(`applied this selectable: ${reaction[0]} to this message: ${msg}`);
}
// function clockSince(message: string) {
//   process.stdout.write(`${new Date().getTime() - global['clock']}ms - ${message}`);
//   global['clock'] = new Date().getTime();
// }
// function reactionFilterLogger(reaction, user) {
//   // testLog(`filtering ${reaction.emoji.name} sent by ${user.id}`);
//   return true;
// }
export function announceToChannels(client, message, channelIds) {
    return arrayify(channelIds).map((channelId) => {
        const channel = client.channels.cache.get(channelId);
        return (((channel === null || channel === void 0 ? void 0 : channel.type) === "dm" || (channel === null || channel === void 0 ? void 0 : channel.type) === "text") &&
            channel.send(message));
    });
    // export function announceToChannels<T extends string | string[]>(
    //   client: Discord.Client,
    //   message: validSendContent,
    //   channelIds: T
    // ): T extends string ? Promise<Discord.Message> : Promise<Discord.Message>[] {
    // return (typeof channelIds === "string" ? results[0] : results) as any;
}
function buildReactionFilter({ users, notUsers, emoji, notEmoji, }) {
    users = users ? arrayify(users) : undefined;
    notUsers = notUsers ? arrayify(notUsers) : undefined;
    emoji = emoji ? arrayify(emoji) : undefined;
    notEmoji = notEmoji ? arrayify(notEmoji) : undefined;
    return (reaction, user) => {
        var _a, _b;
        return ((!users || users.includes(user.id)) &&
            (!notUsers || !notUsers.includes(user.id)) &&
            (!emoji ||
                emoji.includes(reaction.emoji.name) ||
                emoji.includes((_a = reaction.emoji.id) !== null && _a !== void 0 ? _a : "")) &&
            (!notEmoji ||
                (!notEmoji.includes(reaction.emoji.name) &&
                    !notEmoji.includes((_b = reaction.emoji.id) !== null && _b !== void 0 ? _b : ""))));
    };
}
/**
 * waits for client to be ready and then attempts to resolve a channel
 */
export async function resolveChannel(channel) {
    await clientReadyPromise;
    return client.channels.resolve(channel);
}
/**
 * waits for client to be ready and then attempts to resolve an emoji
 */
export async function resolveEmoji(emoji) {
    await clientReadyPromise;
    return client.emojis.resolve(emoji);
}
/**
 * waits for client to be ready and then attempts to resolve a guild
 */
export async function resolveGuild(guild) {
    await clientReadyPromise;
    return client.guilds.resolve(guild);
}
/**
 * waits for client to be ready and then builds an emoji dict from a server or array of servers
 */
export async function buildEmojiDict(guilds) {
    await clientReadyPromise;
    return buildEmojiDictUsingClient(client, guilds);
}
export async function uploadEmojiList(guild, emoteList) {
    await clientReadyPromise;
    return uploadEmojiListUsingClient(client, guild, emoteList);
}
function arrayify(arr) {
    return Array.isArray(arr) ? arr : [arr];
}
function nodeLog(any) {
    return (_e) => {
        process.stdout.write(any);
    };
}
/** try to do whatever func wants to do, but delete msg if there's an error */
async function bugOut(msg, func) {
    try {
        return await func();
    }
    catch (e) {
        (msg === null || msg === void 0 ? void 0 : msg.deleted) || (await (msg === null || msg === void 0 ? void 0 : msg.delete().catch()));
        throw e;
    }
}
export function normalizeID(resolvable) {
    return typeof resolvable === "string"
        ? resolvable
        : resolvable.id;
}
