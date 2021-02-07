//
// things which will self-manage after sending
//
import { MessageEmbed } from "discord.js";
import { sleep } from "one-stone/promise";
import { bugOut } from "../utils/misc.js";
import { presentOptions } from "../utils/user-input.js";
const adjustDirections = { "⬅️": -1, "➡️": 1 };
const directions = Object.keys(adjustDirections);
const random = "🎲";
const dirsAndRandom = [...directions, random];
const trash = "🚮";
export async function sendPaginatedEmbed(_) {
    return (await paginatedEmbedSender(_)).message;
}
export async function sendRerollableEmbed(_) {
    return (await paginatedEmbedSender(Object.assign(Object.assign({}, _), { randomButton: true, arrowButtons: false }))).message;
}
export async function sendRerollableStackEmbed(_) {
    return (await paginatedEmbedSender(Object.assign(Object.assign({}, _), { randomButton: true, arrowButtons: false }))).message;
}
// /** accepts a channel to post to, and a collection of pages to let users switch between
//  * if the pages aren't MessageEmbeds, they are page source data, for a renderer function which turns them into MessageEmbeds
//  * this can be used to defer heavy or async page rendering, until that page is navigated to */
async function paginatedEmbedSender({ channel, renderer = (t) => t, pages, arrowButtons = true, randomButton, noReturn, }) {
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
    // always send the initial embed
    const paginatedMessage = await channel.send(embed);
    // not awaiting this bugOut dispatches it, to monitor the message
    // asynchronously while sendPaginatedEmbed returns the paginatedMessage
    bugOut(paginatedMessage, async () => {
        var _a, _b, _c, _d;
        // if there's pages to switch between, enter a loop of listening for input
        let userInput;
        while (
        // make sure the message is still there
        (!paginatedMessage.deleted &&
            // show pagination if there's pages to move between
            pages.length > 1 &&
            // keep looping as long as user is clicking in a timely fashion i guess
            (userInput = await presentOptions(paginatedMessage, arrowButtons && randomButton
                ? dirsAndRandom
                : arrowButtons
                    ? directions
                    : randomButton
                        ? random
                        : [], "all"))) ||
            // if there's 1 page left and we're in noReturn mode
            (pages.length === 1 &&
                noReturn &&
                // suggest deletion
                (userInput = await presentOptions(paginatedMessage, trash, "all")))) {
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
    return { message: paginatedMessage };
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
    // always send the initial
    const paginatedMessage = await channel.send(embed);
    // not awaiting this bugOut dispatches it, to monitor the message
    // asynchronously while sendPaginatedSelector returns the paginatedMessage
    bugOut(paginatedMessage, async () => {
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
