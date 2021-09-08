import {
	MessageActionRow,
	MessageButton,
	MessageEmbed,
	MessageSelectMenu,
	MessageSelectOptionData,
} from "discord.js";
import {
	ComponentInteractionHandlingData,
	componentInteractions,
	interactionIdSeparator,
} from "../bot/message-components.js";

const paginationIdentifier = "␉";
const paginationArgsSeparator = "␟";
const operationSeparator = "␌";

function getPaginator(paginatorName: string) {
	const paginator = paginationSchemes[paginatorName];
	if (!paginator)
		throw (
			"invalid paginator: " +
			paginatorName +
			"\navailable paginators: " +
			Object.keys(paginationSchemes)
		);
	return paginator;
}

function getFinalizer(paginatorName: string) {
	const finalizer = finalizers[paginatorName];
	if (!finalizer)
		throw (
			"invalid finalizer: " + paginatorName + "\navailable finalizers: " + Object.keys(finalizers)
		);
	return finalizer;
}

function generatePage(paginatorName: string, currentPageNum: number, seed?: string) {
	const paginator = getPaginator(paginatorName);
	const [requestedPage, totalPages, selectorOptions] = paginator(currentPageNum, seed);

	const components = [generatePageControls(paginatorName, currentPageNum, totalPages, seed)];
	if (selectorOptions)
		components.push(generateSelectorControls(paginatorName, selectorOptions, seed));

	return { embeds: [requestedPage], components };
}

function finalizeContent(paginatorName: string, selectionNumber: string, seed?: string) {
	const finalizer = getFinalizer(paginatorName);
	const finalContent = finalizer(selectionNumber, seed);

	return { embeds: [finalContent], components: [] };
}

function generatePageControls(
	paginatorName: string,
	currentPageNum: number,
	totalPages: number,
	seed?: string
) {
	const lastPossiblePage = totalPages - 1;
	const nextPageNum = currentPageNum === lastPossiblePage ? 0 : currentPageNum + 1;
	const prevPageNum = currentPageNum === 0 ? lastPossiblePage : currentPageNum - 1;

	const customIdPrefix =
		paginationIdentifier +
		interactionIdSeparator +
		paginatorName +
		paginationArgsSeparator +
		"page" +
		operationSeparator;
	const customIdSuffix = seed ? paginationArgsSeparator + seed : "";
	return new MessageActionRow({
		components: [
			new MessageButton({
				style: "PRIMARY",
				customId: customIdPrefix + prevPageNum + customIdSuffix,
				emoji: "⬅️",
			}),
			new MessageButton({
				style: "SECONDARY",
				customId: " ",
				label: `${currentPageNum + 1} / ${totalPages}`,
				disabled: true,
			}),
			new MessageButton({
				style: "PRIMARY",
				customId: customIdPrefix + nextPageNum + customIdSuffix,
				emoji: "➡️",
			}),
		],
	});
}

function generateSelectorControls(
	paginatorName: string,
	options: MessageSelectOptionData[],
	seed?: string
) {
	const customId =
		paginationIdentifier +
		interactionIdSeparator +
		paginatorName +
		paginationArgsSeparator +
		"pick" +
		(seed ? paginationArgsSeparator + seed : "");

	return new MessageActionRow({
		components: [
			new MessageSelectMenu({
				options,
				customId,
			}),
		],
	});
}

export function generateInitialPagination(paginatorName: string, seed?: string) {
	return generatePage(paginatorName, 0, seed);
}

const paginationHandler: ComponentInteractionHandlingData = {
	handler: ({ controlID, values }) => {
		const [paginatorName, operation, seed] = controlID.split(paginationArgsSeparator);
		const [operator, operand] = operation.split(operationSeparator);
		if (operator === "page") {
			const requestedPageNum = parseInt(operand);
			return generatePage(paginatorName, requestedPageNum, seed);
		} else if (operator === "pick") {
			if (!values) throw "select was submitted with no value?? " + controlID;
			return finalizeContent(paginatorName, values[0], seed);
		}
	},
	update: true,
};

const paginationSchemes: NodeJS.Dict<
	(
		pageNum: number,
		seed?: string
	) => [
		requestedPage: MessageEmbed,
		totalPages: number,
		selectorOptions?: MessageSelectOptionData[]
	]
> = {};

const finalizers: NodeJS.Dict<(selectionNumber: string, seed?: string) => MessageEmbed> = {};

export function registerPaginator({
	paginatorName,
	getPageData,
}: {
	paginatorName: string;
	getPageData: (
		pageNum: number,
		seed?: string
	) => [requestedPage: MessageEmbed, totalPages: number];
}) {
	// do one-time setup by enabling pagination (␉) among other component handlers
	componentInteractions[paginationIdentifier] = paginationHandler;
	paginationSchemes[paginatorName] = getPageData;
}

export function registerPaginatedSelector({
	paginatorName,
	getPageData,
}: {
	paginatorName: string;
	getPageData: (
		pageNum: number,
		seed?: string
	) => [
		requestedPage: MessageEmbed,
		totalPages: number,
		selectorOptions: MessageSelectOptionData[]
	];
	finalize: (selectionNumber: string, seed?: string) => MessageEmbed;
}) {
	// do one-time setup by enabling pagination (␉) among other component handlers
	componentInteractions[paginationIdentifier] = paginationHandler;
	paginationSchemes[paginatorName] = getPageData;
}
