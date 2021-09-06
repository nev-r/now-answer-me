import { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu } from "discord.js";
import {
	ComponentInteractionHandlingData,
	componentInteractions,
} from "../bot/message-components.js";

const paginationHandler: ComponentInteractionHandlingData = {
	handler: (asdf) => {
		const [paginationScheme, operation, arg] = asdf.controlID.split("␟");
		return JSON.stringify({ paginationScheme, operation, arg }, null, 2);
	},
};

componentInteractions["␉"] = paginationHandler;

const paginationSchemes: NodeJS.Dict<
	(pageNum: number) => [requestedPage: MessageEmbed, totalPages: number]
> = {};

export function createPaginator({
	id,
	getPageData,
}: {
	id: string;
	getPageData: (pageNum: number) => [requestedPage: MessageEmbed, totalPages: number];
}) {
	paginationSchemes[id] = getPageData;
	const [requestedPage, totalPages] = getPageData(0);

	return {
		embeds: [requestedPage],
		components: [
			new MessageActionRow({
				components: [
					new MessageButton({
						style: "PRIMARY",
						customId: id + "␟" + "page" + "␟" + (totalPages - 1),
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
						customId: id + "␟" + "page" + "␟" + 2,
						emoji: "➡️",
					}),
				],
			}),
		],
	};
}
