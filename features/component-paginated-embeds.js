import { MessageActionRow, MessageButton } from "discord.js";
import { componentInteractions, } from "../bot/message-components.js";
const paginationHandler = {
    handler: (asdf) => {
        const [paginatorName, operation, arg] = asdf.controlID.split("␟");
        const getPageData = paginationSchemes[paginatorName];
        if (!getPageData)
            throw ("invalid paginator name: " +
                paginatorName +
                "\navailable paginators: " +
                Object.keys(paginationSchemes));
        if (operation === "page") {
            const requestedPageNum = parseInt(arg);
            const [requestedPage, totalPages] = getPageData(requestedPageNum, arg);
            return generatePage(paginatorName, requestedPageNum, requestedPage, totalPages);
        }
    },
    update: true,
};
function generatePage(paginatorName, requestedPageNum, requestedPage, totalPages) {
    const lastPossiblePage = totalPages - 1;
    const nextPageNum = requestedPageNum === lastPossiblePage ? 0 : requestedPageNum + 1;
    const prevPageNum = requestedPageNum === 0 ? lastPossiblePage : requestedPageNum - 1;
    return {
        embeds: [requestedPage],
        components: [
            new MessageActionRow({
                components: [
                    new MessageButton({
                        style: "PRIMARY",
                        customId: "␉" + "␞" + paginatorName + "␟" + "page" + "␟" + prevPageNum,
                        emoji: "⬅️",
                    }),
                    new MessageButton({
                        style: "SECONDARY",
                        customId: " ",
                        label: `${requestedPageNum + 1} / ${totalPages}`,
                        disabled: true,
                    }),
                    new MessageButton({
                        style: "PRIMARY",
                        customId: "␉" + "␞" + paginatorName + "␟" + "page" + "␟" + nextPageNum,
                        emoji: "➡️",
                    }),
                ],
            }),
        ],
    };
}
componentInteractions["␉"] = paginationHandler;
const paginationSchemes = {};
export function registerPaginator({ paginatorName, getPageData, }) {
    paginationSchemes[paginatorName] = getPageData;
}
export function generateInitialPagination(paginatorName, arg) {
    const getPageData = paginationSchemes[paginatorName];
    if (!getPageData)
        throw ("invalid paginator name: " +
            paginatorName +
            "\navailable paginators: " +
            Object.keys(paginationSchemes));
    const [requestedPage, totalPages] = getPageData(0, arg);
    return generatePage(paginatorName, 0, requestedPage, totalPages);
}
