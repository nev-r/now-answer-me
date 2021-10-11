import { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, } from "discord.js";
import { serialize } from "../bot/component-id-parser.js";
import { componentInteractions, lock, wastebasket, } from "../bot/message-components.js";
const paginationInteractionID = "\u2409"; // ␉
const rightArrow = "\u27a1"; // ➡
const leftArrow = "\u2b05"; // ⬅
function getPaginator(paginatorName) {
    const paginator = paginationSchemes[paginatorName];
    if (!paginator)
        throw ("invalid paginator: " +
            paginatorName +
            "\navailable paginators: " +
            Object.keys(paginationSchemes));
    return paginator;
}
function getFinalizer(paginatorName) {
    const finalizer = finalizers[paginatorName];
    if (!finalizer)
        throw ("invalid finalizer: " + paginatorName + "\navailable finalizers: " + Object.keys(finalizers));
    return finalizer;
}
function generatePage(paginatorName, currentPageNum, seed, includeLock, includeRemove) {
    const paginator = getPaginator(paginatorName);
    const [requestedPage, totalPages, selectorOptions] = paginator(currentPageNum, seed);
    const components = [];
    if (totalPages > 1)
        components.push(generatePageControls(paginatorName, currentPageNum, totalPages, seed, !selectorOptions, includeRemove));
    if (selectorOptions)
        components.push(generateSelectorControls(paginatorName, selectorOptions, seed));
    return { embeds: [requestedPage], components };
}
function finalizeContent(paginatorName, selectionNumber, seed) {
    const finalizer = getFinalizer(paginatorName);
    const finalContent = finalizer(selectionNumber, seed);
    if (finalContent instanceof MessageEmbed)
        return { embeds: [finalContent], components: [] };
    return finalContent;
}
function generatePageControls(paginatorID, currentPageNum, totalPages, seed, includeLock, includeRemove) {
    const lastPossiblePage = totalPages - 1;
    let prevPageNum = `${currentPageNum === 0 ? lastPossiblePage : currentPageNum - 1}`;
    const nextPageNum = `${currentPageNum === lastPossiblePage ? 0 : currentPageNum + 1}`;
    if (prevPageNum === nextPageNum)
        prevPageNum = "0" + prevPageNum;
    const prevCustomID = serialize({
        interactionID: paginationInteractionID,
        paginatorID,
        seed,
        operation: "page",
        operand: prevPageNum,
    });
    const nextCustomID = serialize({
        interactionID: paginationInteractionID,
        paginatorID,
        seed,
        operation: "page",
        operand: nextPageNum,
    });
    const pageLabel = `${currentPageNum + 1} / ${totalPages}`;
    const components = [
        new MessageButton({ style: "PRIMARY", customId: prevCustomID, emoji: leftArrow }),
        new MessageButton({ style: "SECONDARY", customId: " ", label: pageLabel, disabled: true }),
        new MessageButton({ style: "PRIMARY", customId: nextCustomID, emoji: rightArrow }),
    ];
    if (includeLock)
        components.push(new MessageButton({ style: "SUCCESS", customId: lock, emoji: lock }));
    if (includeRemove)
        components.push(new MessageButton({ style: "DANGER", customId: wastebasket, emoji: wastebasket }));
    return new MessageActionRow({
        components,
    });
}
function generateSelectorControls(paginatorID, options, seed) {
    const customId = serialize({
        interactionID: paginationInteractionID,
        paginatorID,
        seed,
        operation: "pick",
    });
    return new MessageActionRow({
        components: [
            new MessageSelectMenu({
                options,
                customId,
            }),
        ],
    });
}
function generateInitialPagination(paginatorName, seed, includeLock, includeRemove) {
    return generatePage(paginatorName, 0, seed, includeLock, includeRemove);
}
function generateInitialPaginatedSelector(paginatorName, seed, includeLock, includeRemove) {
    return generatePage(paginatorName, 0, seed, includeLock, includeRemove);
}
const paginationHandler = {
    handler: ({ componentParams, values }) => {
        const { paginatorID, seed, operation, operand } = componentParams;
        if (!paginatorID)
            throw "pagination handler was reached without a paginatorID...";
        if (operation === "page") {
            if (!operand)
                throw "page change submitted with no target page number";
            const requestedPageNum = parseInt(operand);
            return generatePage(paginatorID, requestedPageNum, seed, true, true);
        }
        else if (operation === "pick") {
            if (!values)
                throw "select was submitted with no value?? " + JSON.stringify(componentParams);
            return finalizeContent(paginatorID, values[0], seed);
        }
    },
    update: true,
};
const paginationSchemes = {};
const finalizers = {};
export function createPaginator({ paginatorName, getPageData, }) {
    // do one-time setup by enabling pagination (␉) among other component handlers
    componentInteractions[paginationInteractionID] = paginationHandler;
    paginationSchemes[paginatorName] = getPageData;
    // return the function that initiates this paginator
    return (seed) => generateInitialPagination(paginatorName, seed, true, true);
}
export function createPaginatedSelector({ paginatorName, getPageData, finalizer, }) {
    // do one-time setup by enabling pagination (␉) among other component handlers
    componentInteractions[paginationInteractionID] = paginationHandler;
    // register this specific paginator and finalizer
    finalizers[paginatorName] = finalizer;
    paginationSchemes[paginatorName] = getPageData;
    // return the function that initiates this selector
    return (seed) => generateInitialPaginatedSelector(paginatorName, seed, false, true);
}
