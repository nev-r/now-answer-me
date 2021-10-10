import {
	InteractionReplyOptions,
	MessageActionRow,
	MessageButton,
	MessageEmbed,
	MessageSelectMenu,
	MessageSelectOptionData,
} from "discord.js";
import {
	ComponentInteractionHandlingData,
	componentInteractions,
	encodeCustomID,
	lock,
	wastebasket,
} from "../bot/message-components.js";

const paginationIdentifier = "\u2409"; // ␉
const paginationArgsSeparator = "\u241f"; // ␟
const operationSeparator = "\u240c"; // ␌
const rightArrow = "\u27a1"; // ➡
const leftArrow = "\u2b05"; // ⬅

function decodeControlID(controlID: string) {
	const [paginatorName, operation, seed] = controlID.split(paginationArgsSeparator);
	const [operator, operand] = operation.split(operationSeparator);
	return { paginatorName, seed, operator, operand };
}

function encodeControlID(
	paginatorName: string,
	seed: string | undefined,
	operator: string,
	operand?: string
) {
	const operation = [operator, operand].filter(Boolean).join(operationSeparator);
	return [paginatorName, operation, seed].filter(Boolean).join(paginationArgsSeparator);
}

function encodePaginationCustomID(controlID: string) {
	return encodeCustomID(paginationIdentifier, controlID);
}

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
				includeLock,
				includeRemove
			)
		);
	if (selectorOptions)
		components.push(generateSelectorControls(paginatorName, selectorOptions, seed));

	return { embeds: [requestedPage], components };
}

function finalizeContent(paginatorName: string, selectionNumber: string, seed?: string) {
	const finalizer = getFinalizer(paginatorName);
	const finalContent = finalizer(selectionNumber, seed);
	if (finalContent instanceof MessageEmbed) return { embeds: [finalContent], components: [] };
	return finalContent;
}

function generatePageControls(
	paginatorName: string,
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

	const prevControlID = encodeControlID(paginatorName, seed, "page", prevPageNum);
	const nextControlID = encodeControlID(paginatorName, seed, "page", nextPageNum);

	const prevCustomID = encodePaginationCustomID(prevControlID);
	const nextCustomID = encodePaginationCustomID(nextControlID);
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
	paginatorName: string,
	options: MessageSelectOptionData[],
	seed?: string
) {
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
	handler: ({ controlID, values }) => {
		const { paginatorName, seed, operator, operand } = decodeControlID(controlID);
		if (operator === "page") {
			const requestedPageNum = parseInt(operand);
			return generatePage(paginatorName, requestedPageNum, seed, true, true);
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

const finalizers: NodeJS.Dict<
	(selectionNumber: string, seed?: string) => InteractionReplyOptions | MessageEmbed
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
	componentInteractions[paginationIdentifier] = paginationHandler;
	paginationSchemes[paginatorName] = getPageData;

	// return the function that initiates this paginator
	return (seed?: string) => generateInitialPagination(paginatorName, seed);
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
	finalizer: (selectionNumber: string, seed?: string) => InteractionReplyOptions | MessageEmbed;
}) {
	// do one-time setup by enabling pagination (␉) among other component handlers
	componentInteractions[paginationIdentifier] = paginationHandler;

	// register this specific paginator and finalizer
	finalizers[paginatorName] = finalizer;
	paginationSchemes[paginatorName] = getPageData;

	// return the function that initiates this selector
	return (seed?: string) => generateInitialPaginatedSelector(paginatorName, seed);
}
