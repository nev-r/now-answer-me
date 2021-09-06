import { MessageActionRow, MessageButton } from "discord.js";
import { componentInteractions, } from "../bot/message-components.js";
const paginationHandler = {
    handler: (asdf) => {
        const [paginationScheme, operation, arg] = asdf.controlID.split("␟");
        return JSON.stringify({ paginationScheme, operation, arg }, null, 2);
    },
};
componentInteractions[""] = paginationHandler;
const paginationSchemes = {};
export function createPaginator({ id, getPageData, }) {
    paginationSchemes[id] = getPageData;
    const [requestedPage, totalPages] = getPageData(0);
    return {
        embeds: [requestedPage],
        components: [
            new MessageActionRow({
                components: [
                    new MessageButton({
                        style: "PRIMARY",
                        customId: "␉" + "␞" + id + "␟" + "page" + "␟" + (totalPages - 1),
                        emoji: "⬅️",
                    }),
                    new MessageButton({
                        style: "SECONDARY",
                        customId: " ",
                        label: `1 / ${totalPages}`,
                        disabled: true,
                    }),
                    new MessageButton({
                        style: "PRIMARY",
                        customId: "␉" + "␞" + id + "␟" + "page" + "␟" + 1,
                        emoji: "➡️",
                    }),
                ],
            }),
        ],
    };
}
