import { client, clientReadyPromise } from "./bot.js";
import { buildEmojiDictUsingClient, uploadEmojiListUsingClient, } from "./raw-utils.js";
/**
 * accepts the results of a `channel.send`, `await channel.send` or wraps a `channel.send`
 *
 * deletes message if someone reacts with wastebasket `🗑`, litter `🚮`, or cancel `🚫`
 */
export async function makeTrashable(msg) {
    msg = await Promise.resolve(msg);
    if (!msg)
        return;
    const userReactions = await msg.awaitReactions((reaction) => trashEmojis.includes(reaction.emoji.name), { max: 1, time: 300000 });
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
/**
 * accepts a channel to post to, a list of `T`s, and a function that turns a `T` into a valid `MessageEmbed`
 */
export async function sendPaginatedEmbed(channel, contentList, renderer) {
    var _a;
    let currentPage = 0;
    let paginatedMessage;
    let done = false;
    const options = Object.keys(adjustDirections);
    while (true) {
        // either send, or update, the embed
        const embed = renderer(contentList[currentPage]);
        !done && embed.setFooter(`${currentPage + 1} / ${contentList.length}`);
        if (!paginatedMessage) {
            paginatedMessage = await channel.send(embed);
            makeTrashable(paginatedMessage);
        }
        else
            await paginatedMessage.edit(embed);
        // final edit completed
        if (done)
            return;
        // wait to see if something is clicked
        let adjustReact = await presentOptions(paginatedMessage, options, "others");
        // we're done if there was no response
        if (!adjustReact)
            done = true;
        // otherwise, adjust the page accordingly and loop again to update embed
        currentPage += (_a = adjustDirections[adjustReact !== null && adjustReact !== void 0 ? adjustReact : "done"]) !== null && _a !== void 0 ? _a : 0;
        if (currentPage + 1 > contentList.length)
            currentPage = 0;
        if (currentPage < 0)
            currentPage = contentList.length - 1;
    }
}
const adjustDirections = { "⬅️": -1, "➡️": 1 };
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
        const reactionGroups = await msg.awaitReactions(reactionFilter, awaitOptions);
        // we timed out instead of getting a valid reaction
        if (!reactionGroups.size) {
            msg.reactions.removeAll();
            return undefined;
        }
        switch (cleanupReactions) {
            case "others":
                Promise.all([...reactionGroups.values()].flatMap((reactionGroup) => [...reactionGroup.users.cache.values()]
                    .filter((user) => { var _a; return user.id !== ((_a = msg.client.user) === null || _a === void 0 ? void 0 : _a.id); })
                    .map((user) => {
                    console.log(`removing [${reactionGroup.emoji.identifier}][${reactionGroup.emoji.name}] from [${user.username}]`);
                    return reactionGroup.users.remove(user);
                })));
                break;
            default:
                msg.reactions.removeAll();
                break;
        }
        const { name, id } = (_c = (_b = reactionGroups.first()) === null || _b === void 0 ? void 0 : _b.emoji) !== null && _c !== void 0 ? _c : {};
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
    // console.log(`!!applying this selectable: ${reaction[0]} to this message: ${msg}`);
    await msg.react(reaction).catch(nodeLog(`${reaction[0]}≠>${msg}`));
    // console.log(`applied this selectable: ${reaction[0]} to this message: ${msg}`);
}
// function clockSince(message: string) {
//   process.stdout.write(`${new Date().getTime() - global['clock']}ms - ${message}`);
//   global['clock'] = new Date().getTime();
// }
function reactionFilterLogger(reaction, user) {
    // testLog(`filtering ${reaction.emoji.name} sent by ${user.id}`);
    return true;
}
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
// function ok<T extends number | string>(x: T): Switched<T> {
//   if (typeof x === "number") return x.toString();
//   else return Number(x);
// }
// function ok<T extends number | string>(x: T): Switched<T> {
//   if (typeof x === "number") return x.toString();
//   else return Number(x);
// }
// function swapType<T extends string>(x: T): number;
// function swapType<T extends number>(x: T): string;
// function swapType<T extends number | string>(x: T): number | string {
//   if (typeof x === "number") return x.toString();
//   else return Number(x);
// }
// function fn<D extends string | undefined>(
//   someParam: string,
//   defaultValue?: D
// ): string | (D extends undefined ? undefined : never) {
//   const result = "";
//   return result;
// }
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
    uploadEmojiListUsingClient(client, guild, emoteList);
}
function arrayify(arr) {
    return Array.isArray(arr) ? arr : [arr];
}
function nodeLog(any) {
    return (_e) => {
        process.stdout.write(any);
    };
}
