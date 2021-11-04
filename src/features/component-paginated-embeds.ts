import {
	InteractionReplyOptions,
	MessageActionRow,
	MessageButton,
	MessageEmbed,
	MessageSelectMenu,
	MessageSelectOptionData,
} from "discord.js";
import { Awaitable } from "one-stone/types";
import { serialize } from "../bot/component-id-parser.js";

import {
	ComponentInteractionHandlingData,
	componentInteractions,
	lock,
	wastebasket,
} from "../bot/message-components.js";

const paginationInteractionID = "\u2409"; // ␉
const rightArrow = "\u27a1"; // ➡
const leftArrow = "\u2b05"; // ⬅

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

function generatePage(
	paginatorName: string,
	currentPageNum: number,
	seed?: string,
	includeLock?: boolean,
	includeRemove?: boolean
) {
	const paginator = getPaginator(paginatorName);
	const [requestedPage, totalPages, selectorOptions] = paginator(currentPageNum, seed);

	const components: MessageActionRow[] = [];
	if (totalPages > 1)
		components.push(
			generatePageControls(
				paginatorName,
				currentPageNum,
				totalPages,
				seed,
				!selectorOptions,
				includeRemove
			)
		);
	if (selectorOptions)
		components.push(generateSelectorControls(paginatorName, selectorOptions, seed));

	return { embeds: [requestedPage], components };
}

async function finalizeContent(paginatorName: string, selectionNumber: string, seed?: string) {
	const finalizer = getFinalizer(paginatorName);
	const finalContent = await finalizer(selectionNumber, seed);
	if (finalContent instanceof MessageEmbed) return { embeds: [finalContent], components: [] };
	return finalContent;
}

function generatePageControls(
	paginatorID: string,
	currentPageNum: number,
	totalPages: number,
	seed?: string,
	includeLock?: boolean,
	includeRemove?: boolean
) {
	const lastPossiblePage = totalPages - 1;
	let prevPageNum = `${currentPageNum === 0 ? lastPossiblePage : currentPageNum - 1}`;
	const nextPageNum = `${currentPageNum === lastPossiblePage ? 0 : currentPageNum + 1}`;
	if (prevPageNum === nextPageNum) prevPageNum = "0" + prevPageNum;

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
		components.push(
			new MessageButton({ style: "DANGER", customId: wastebasket, emoji: wastebasket })
		);

	return new MessageActionRow({
		components,
	});
}

function generateSelectorControls(
	paginatorID: string,
	options: MessageSelectOptionData[],
	seed?: string
) {
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

function generateInitialPagination(
	paginatorName: string,
	seed?: string,
	includeLock?: boolean,
	includeRemove?: boolean
) {
	return generatePage(paginatorName, 0, seed, includeLock, includeRemove);
}

function generateInitialPaginatedSelector(
	paginatorName: string,
	seed?: string,
	includeLock?: boolean,
	includeRemove?: boolean
) {
	return generatePage(paginatorName, 0, seed, includeLock, includeRemove);
}

const paginationHandler: ComponentInteractionHandlingData = {
	handler: async ({ componentParams, values }) => {
		const { paginatorID, seed, operation, operand } = componentParams;
		if (!paginatorID) throw "pagination handler was reached without a paginatorID...";
		if (operation === "page") {
			if (!operand) throw "page change submitted with no target page number";
			const requestedPageNum = parseInt(operand);
			return generatePage(paginatorID, requestedPageNum, seed, true, true);
		} else if (operation === "pick") {
			if (!values) throw "select was submitted with no value?? " + JSON.stringify(componentParams);
			return await finalizeContent(paginatorID, values[0], seed);
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

const finalizers: NodeJS.Dict<
	(selectionNumber: string, seed?: string) => Awaitable<InteractionReplyOptions | MessageEmbed>
> = {};

export function createPaginator({
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
	componentInteractions[paginationInteractionID] = paginationHandler;
	paginationSchemes[paginatorName] = getPageData;

	// return the function that initiates this paginator
	return (seed?: string) => generateInitialPagination(paginatorName, seed, true, true);
}

export function createPaginatedSelector({
	paginatorName,
	getPageData,
	finalizer,
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
	finalizer: (
		selectionNumber: string,
		seed?: string
	) => Awaitable<InteractionReplyOptions | MessageEmbed>;
}) {
	// do one-time setup by enabling pagination (␉) among other component handlers
	componentInteractions[paginationInteractionID] = paginationHandler;

	// register this specific paginator and finalizer
	finalizers[paginatorName] = finalizer;
	paginationSchemes[paginatorName] = getPageData;

	// return the function that initiates this selector
	return (seed?: string) => generateInitialPaginatedSelector(paginatorName, seed, false, true);
}
