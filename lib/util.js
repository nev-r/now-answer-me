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
    bugOut(paginatedMessage, async () => {
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
export async function sendPaginatedSelector({ user, channel, contentList, optionRenderer = (l, i) => ({ name: i, value: `${l}`, inline: true }), resultRenderer = (l) => new MessageEmbed({ description: `${l}` }), prompt = "respond with a number", itemsPerPage = 25, }) {
    const numPages = Math.ceil(contentList.length / itemsPerPage);
    let currentPage = 0;
    // death to the counterintuitive loop!
    let embed = new MessageEmbed({
        fields: contentList
            .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
            .map((t, i) => optionRenderer(t, currentPage * itemsPerPage + i + 1)),
    });
    if (contentList.length > 1) {
        embed.setFooter(`${currentPage + 1} / ${contentList.length}`);
    }
    // always send the initial embed and always make it trashable
    const paginatedMessage = await channel.send(embed);
    makeTrashable(paginatedMessage);
    bugOut(paginatedMessage, async () => {
        var _a;
        // this continually listens for a numeric choice
        const choiceDetector = (async () => {
            var _a;
            const choice = (_a = (await channel.awaitMessages((m) => {
                if (m.author.id !== user.id || !/^\d+$/.test(m.content))
                    return false;
                const index = Number(m.content);
                return index > 0 && index <= contentList.length;
            }, { max: 1, time: 60000 })).first()) === null || _a === void 0 ? void 0 : _a.content;
            if (choice)
                return Number(choice);
        })();
        let userInput;
        // wait to see if something is clicked
        while ((userInput = await Promise.race([
            // if there's pages to switch between,
            ...(contentList.length > 1
                ? // include a page selector
                    [presentOptions(paginatedMessage, directions, "all")]
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
                embed.setFooter(`${currentPage + 1} / ${contentList.length}`);
                await paginatedMessage.edit(embed);
                // and then just continue waiting for a new pagination input
            }
            else {
                // a message with a valid number was detected
                embed = resultRenderer(contentList[userInput]);
                await paginatedMessage.edit(embed);
                // completely escape the loop, and the "timed out" loop cleanup
                return;
            }
        }
        // loop breaks when there's no more input
        // (someone stopped paginating, or didn't make a choice)
        // we'll give up i guess, and delete the selector message
        await paginatedMessage.delete();
    });
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
    await serialReactions(msg, options_);
    // let reactionGroups: Discord.Collection<string, Discord.MessageReaction>;
    try {
        const reactionFilter = buildReactionFilter({
            notUsers: (_a = msg.client.user) === null || _a === void 0 ? void 0 : _a.id,
            emoji: options_,
        });
        const reactionCollection = await msg.awaitReactions(reactionFilter, awaitOptions);
        // we timed out instead of getting a valid reaction
        if (!reactionCollection.size) {
            msg.reactions.removeAll();
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
                await msg.reactions.removeAll();
                await sleep(800);
                break;
        }
        const { name, id } = (_c = (_b = reactionCollection.first()) === null || _b === void 0 ? void 0 : _b.emoji) !== null && _c !== void 0 ? _c : {};
        // console.log(
        //   `returning a selected option: ${
        //     name && options.includes(name)
        //       ? name
        //       : id && options.includes(id)
        //       ? id
        //       : undefined
        //   }`
        // );
        return name && options.includes(name)
            ? name
            : id && options.includes(id)
                ? id
                : undefined;
        // return awaitOptions.max===1 ? reactionGroups.first()?.emoji.name:;
    }
    catch (e) {
        // bothLog('awaitReactions failed, which is... weird\n');
        // bothLog(e);
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
// try to do whatever func wants to do, but delete msg if there's an error
async function bugOut(msg, func) {
    try {
        return await func();
    }
    catch (e) {
        await msg.delete();
        throw e;
    }
}
