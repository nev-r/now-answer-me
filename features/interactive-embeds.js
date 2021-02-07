//
// things which will self-manage after sending
//
import { MessageEmbed } from "discord.js";
import { sleep } from "one-stone/promise";
import { bugOut, delMsg } from "../utils/misc.js";
import { presentOptions } from "../utils/user-input.js";
const adjustDirections = { "⬅️": -1, "➡️": 1 };
const directions = Object.keys(adjustDirections);
const random = "🎲";
const dirsAndRandom = [...directions, random];
const trash = "🚮";
export async function sendPaginatedEmbed(_) {
    return (await _paginatedEmbedSender_(_)).message;
}
export async function sendRerollableEmbed(_) {
    return (await _paginatedEmbedSender_(Object.assign(Object.assign({}, _), { randomButton: true, arrowButtons: false }))).message;
}
export async function sendRerollableStackEmbed(_) {
    return (await _paginatedEmbedSender_(Object.assign(Object.assign({}, _), { randomButton: true, arrowButtons: false }))).message;
}
// /** accepts a channel to post to, and a collection of pages to let users switch between* if the pages aren't MessageEmbeds, they are page source data, for a renderer function which turns them into MessageEmbeds* this can be used to defer heavy or async page rendering, until that page is navigated to */
// aborting this prevents further pagination but does not clean up its reactions,
// to prevent race conditions from deleting needed reactions
async function _paginatedEmbedSender_({ preexistingMessage, channel = preexistingMessage === null || preexistingMessage === void 0 ? void 0 : preexistingMessage.channel, renderer = (t) => t, pages, arrowButtons = true, randomButton, noReturn, abortController = { aborted: false }, }) {
    if (!channel)
        throw new Error("no channel provided to send pagination to");
    // we might modify this array, so copy it
    pages = Array.from(pages);
    let currentPage = 0;
    if (!pages) {
        pages;
    }
    let embed = await renderer(pages[currentPage]);
    if (pages.length > 1 && embed.footer === null) {
        embed.setFooter(noReturn ? `${pages.length - 1} remaining` : `${currentPage + 1} / ${pages.length}`);
    }
    const paginatedMessage = preexistingMessage
        ? await preexistingMessage.edit(embed)
        : await channel.send(embed);
    // not awaiting this bugOut dispatches it, to monitor the message
    // asynchronously while sendPaginatedEmbed returns the paginatedMessage
    bugOut(paginatedMessage, async () => {
        var _a, _b, _c, _d;
        // if there's pages to switch between, enter a loop of listening for input
        let userInput;
        ("messageDelete");
        const reactOptions = arrowButtons && randomButton
            ? dirsAndRandom
            : arrowButtons
                ? directions
                : randomButton
                    ? random
                    : undefined;
        while (!(abortController === null || abortController === void 0 ? void 0 : abortController.aborted) &&
            // make sure the message is still there
            ((!paginatedMessage.deleted &&
                // show pagination if there's pages to move between
                pages.length > 1 &&
                // keep looping as long as user is clicking in a timely fashion i guess
                reactOptions &&
                (userInput = await presentOptions(paginatedMessage, reactOptions, "all"))) ||
                // if there's 1 page left and we're in noReturn mode
                (pages.length === 1 &&
                    noReturn &&
                    // suggest deletion
                    (userInput = await presentOptions(paginatedMessage, trash, "others"))))) {
            if (abortController === null || abortController === void 0 ? void 0 : abortController.aborted)
                return;
            if (noReturn) {
                pages.splice(currentPage, 1);
                // removing current position effectively advances the page by 1, so undo it
                if (userInput === "➡️") {
                    currentPage--;
                }
            }
            if (userInput === trash) {
                // user is done. maybe the message will dump itself.
                // allow the deleted property to update then break loop
                await sleep(200);
                break;
            }
            // adjust the page accordingly
            else if (userInput === random) {
                currentPage = Math.floor(Math.random() * pages.length);
            }
            else {
                currentPage += adjustDirections[userInput];
                if (currentPage + 1 > pages.length)
                    currentPage = 0;
                if (currentPage < 0)
                    currentPage = pages.length - 1;
            }
            // and update the message with the new embed
            embed = await renderer(pages[currentPage]);
            if (embed.footer === null)
                embed.setFooter(noReturn ? `${pages.length - 1} remaining` : `${currentPage + 1} / ${pages.length}`);
            await paginatedMessage.edit(embed);
        }
        // loop breaks when there's no more input.
        // let's remove the pagination footer (if we were using it to count)
        // and perform one last edit (if the message is still there)
        if (((_b = (_a = embed.footer) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.match(/^\d+ \/ \d+$/)) || ((_d = (_c = embed.footer) === null || _c === void 0 ? void 0 : _c.text) === null || _d === void 0 ? void 0 : _d.match(/^\d+ remaining$/)))
            embed.footer = null;
        paginatedMessage.deleted || (await paginatedMessage.edit(embed));
    });
    return { message: paginatedMessage, abortController };
}
/**
 * accepts a channel to post to, a list of `T`s, and a function that turns a `T` into a valid element of a `MessageEmbed` field
 */
export async function sendPaginatedSelector({ preexistingMessage, user, channel, selectables, optionRenderer = (l, i) => ({ name: i, value: `${l}`, inline: true }), resultRenderer = (l) => new MessageEmbed({ description: `${l}` }), resultAction = async (s, c) => {
    await s.edit(await resultRenderer(c));
}, prompt = "choose by responding with a number:", itemsPerPage = 25, }) {
    const numPages = Math.ceil(selectables.length / itemsPerPage);
    const pages = [...Array(numPages)].map((x, pageNum) => {
        const pageEmbed = new MessageEmbed({
            fields: selectables
                .slice(pageNum * itemsPerPage, (pageNum + 1) * itemsPerPage)
                .map((t, i) => optionRenderer(t, pageNum * itemsPerPage + i + 1)),
        });
        prompt && pageEmbed.setDescription(prompt);
        numPages > 1 && pageEmbed.setFooter(`${pageNum + 1} / ${numPages}`);
        return pageEmbed;
    });
    const abortController = { aborted: false };
    const selectorMessage = (await _paginatedEmbedSender_({
        pages,
        preexistingMessage,
        channel,
        abortController,
    })).message;
    // not awaiting this bugOut dispatches it, to monitor the message
    // asynchronously while sendPaginatedSelector returns the selectorMessage
    bugOut(selectorMessage, async () => {
        // this continually listens for a numeric choice
        const choiceDetector = (async () => {
            const choiceMessage = (await channel.awaitMessages((m) => {
                if (m.author.id !== user.id || !/^\d+$/.test(m.content))
                    return false;
                const index = Number(m.content);
                return index > 0 && index <= selectables.length;
            }, { max: 1, time: 300000 })).first();
            if (choiceMessage) {
                await delMsg(choiceMessage);
                return Number(choiceMessage.content);
            }
        })();
        const userInput = await choiceDetector;
        if (userInput) {
            abortController.aborted = true;
            await selectorMessage.reactions.removeAll();
            await sleep(800);
            resultAction(selectorMessage, selectables[userInput - 1]);
        }
    });
}
