import { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, } from "discord.js";
import { componentInteractions, encodeCustomID, } from "../bot/message-components.js";
const paginationIdentifier = "␉";
const paginationArgsSeparator = "␟";
const operationSeparator = "␌";
function decodeControlID(controlID) {
    const [paginatorName, operation, seed] = controlID.split(paginationArgsSeparator);
    const [operator, operand] = operation.split(operationSeparator);
    return { paginatorName, seed, operator, operand };
}
function encodeControlID(paginatorName, seed, operator, operand) {
    const operation = [operator, operand].filter(Boolean).join(operationSeparator);
    return [paginatorName, operation, seed].filter(Boolean).join(paginationArgsSeparator);
}
function encodePaginationCustomID(controlID) {
    return encodeCustomID(paginationIdentifier, controlID);
}
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
function generatePage(paginatorName, currentPageNum, seed) {
    const paginator = getPaginator(paginatorName);
    const [requestedPage, totalPages, selectorOptions] = paginator(currentPageNum, seed);
    const components = [];
    if (totalPages > 1)
        components.push(generatePageControls(paginatorName, currentPageNum, totalPages, seed));
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
function generatePageControls(paginatorName, currentPageNum, totalPages, seed) {
    const lastPossiblePage = totalPages - 1;
    let prevPageNum = `${currentPageNum === 0 ? lastPossiblePage : currentPageNum - 1}`;
    const nextPageNum = `${currentPageNum === lastPossiblePage ? 0 : currentPageNum + 1}`;
    if (prevPageNum === nextPageNum)
        prevPageNum = "0" + prevPageNum;
    const prevControlID = encodeControlID(paginatorName, seed, "page", prevPageNum);
    const nextControlID = encodeControlID(paginatorName, seed, "page", nextPageNum);
    const prevCustomID = encodePaginationCustomID(prevControlID);
    const nextCustomID = encodePaginationCustomID(nextControlID);
    const pageLabel = `${currentPageNum + 1} / ${totalPages}`;
    return new MessageActionRow({
        components: [
            new MessageButton({ style: "PRIMARY", customId: prevCustomID, emoji: "⬅️" }),
            new MessageButton({ style: "SECONDARY", customId: " ", label: pageLabel, disabled: true }),
            new MessageButton({ style: "PRIMARY", customId: nextCustomID, emoji: "➡️" }),
        ],
    });
}
function generateSelectorControls(paginatorName, options, seed) {
    const controlID = encodeControlID(paginatorName, seed, "pick");
    const customId = encodeCustomID(paginationIdentifier, controlID);
    return new MessageActionRow({
        components: [
            new MessageSelectMenu({
                options,
                customId,
            }),
        ],
    });
}
function generateInitialPagination(paginatorName, seed) {
    return generatePage(paginatorName, 0, seed);
}
function generateInitialPaginatedSelector(paginatorName, seed) {
    return generatePage(paginatorName, 0, seed);
}
const paginationHandler = {
    handler: ({ controlID, values }) => {
        const { paginatorName, seed, operator, operand } = decodeControlID(controlID);
        if (operator === "page") {
            const requestedPageNum = parseInt(operand);
            return generatePage(paginatorName, requestedPageNum, seed);
        }
        else if (operator === "pick") {
            if (!values)
                throw "select was submitted with no value?? " + controlID;
            return finalizeContent(paginatorName, values[0], seed);
        }
    },
    update: true,
};
const paginationSchemes = {};
const finalizers = {};
export function createPaginator({ paginatorName, getPageData, }) {
    // do one-time setup by enabling pagination (␉) among other component handlers
    componentInteractions[paginationIdentifier] = paginationHandler;
    paginationSchemes[paginatorName] = getPageData;
    // return the function that initiates this paginator
    return (seed) => generateInitialPagination(paginatorName, seed);
}
export function createPaginatedSelector({ paginatorName, getPageData, finalizer, }) {
    // do one-time setup by enabling pagination (␉) among other component handlers
    componentInteractions[paginationIdentifier] = paginationHandler;
    // register this specific paginator and finalizer
    finalizers[paginatorName] = finalizer;
    paginationSchemes[paginatorName] = getPageData;
    // return the function that initiates this selector
    return (seed) => generateInitialPaginatedSelector(paginatorName, seed);
}
