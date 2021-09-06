import { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu } from "discord.js";
import {
	ComponentInteractionHandlingData,
	componentInteractions,
} from "../bot/message-components.js";

const paginationHandler: ComponentInteractionHandlingData = {
	handler: (asdf) => {
		const [paginationScheme, operation, arg] = asdf.controlID.split("␟");
		const getPageData = paginationSchemes[paginationScheme];
		if (!getPageData) throw "invalid paginationScheme: " + paginationScheme;
		if (operation === "page") {
			const targetPageNum = parseInt(arg);
			const [requestedPage, totalPages] = getPageData(targetPageNum);

			const lastPossiblePage = totalPages - 1;
			const nextPageNum = targetPageNum === lastPossiblePage ? 0 : targetPageNum + 1;
			const prevPageNum = targetPageNum === 0 ? lastPossiblePage : targetPageNum - 1;
			return {
				embeds: [requestedPage],
				components: [
					new MessageActionRow({
						components: [
							new MessageButton({
								style: "PRIMARY",
								customId: "␉" + "␞" + paginationScheme + "␟" + "page" + "␟" + prevPageNum,
								emoji: "⬅️",
							}),
							new MessageButton({
								style: "SECONDARY",
								customId: " ",
								label: `${targetPageNum + 1} / ${totalPages}`,
								disabled: true,
							}),
							new MessageButton({
								style: "PRIMARY",
								customId: "␉" + "␞" + paginationScheme + "␟" + "page" + "␟" + nextPageNum,
								emoji: "➡️",
							}),
						],
					}),
				],
			};
		}
	},
	update: true,
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
