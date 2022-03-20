import {
	ActionRowBuilder,
	ButtonBuilder,
	MessageActionRowComponentBuilder,
	SelectMenuBuilder,
} from "@discordjs/builders";
import {
	InteractionReplyOptions,
	ActionRow,
	ButtonComponent,
	Embed,
	SelectMenuComponent,
	ButtonStyle,
	ComponentType,
	APISelectMenuOption,
} from "discord.js";
import { Awaitable } from "one-stone/types";
import { serialize } from "../bot/component-id-parser.js";

import {
	ComponentInteractionHandlingData,
	componentInteractions,
	lock,
	lockEmoji,
	wastebasket,
	wastebasketEmoji,
} from "../bot/message-components.js";
import { Sendable } from "../types/types-discord.js";

const paginationInteractionID = "\u2409"; // ␉
const rightArrow = "\u27a1"; // ➡
const rightArrowEmoji = { name: "\u27a1" }; // ➡
const leftArrow = "\u2b05"; // ⬅
const leftArrowEmoji = { name: "\u2b05" }; // ⬅

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

	const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];
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
	if (finalContent instanceof Embed) return { embeds: [finalContent], components: [] };
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
		new ButtonBuilder({
			style: ButtonStyle.Primary,
			custom_id: prevCustomID,
			emoji: leftArrowEmoji,
		}),
		new ButtonBuilder({
			style: ButtonStyle.Secondary,
			custom_id: " ",
			label: pageLabel,
			disabled: true,
		}),
		new ButtonBuilder({
			type: ComponentType.Button,
			style: ButtonStyle.Primary,
			custom_id: nextCustomID,
			emoji: rightArrowEmoji,
		}),
	];
	if (includeLock)
		components.push(
			new ButtonBuilder({
				type: ComponentType.Button,
				style: ButtonStyle.Success,
				custom_id: lock,
				emoji: lockEmoji,
			})
		);
	if (includeRemove)
		components.push(
			new ButtonBuilder({
				type: ComponentType.Button,
				style: ButtonStyle.Danger,
				custom_id: wastebasket,
				emoji: wastebasketEmoji,
			})
		);

	return new ActionRowBuilder().setComponents(...components);
}

function generateSelectorControls(
	paginatorID: string,
	options: APISelectMenuOption[],
	seed?: string
) {
	const custom_id = serialize({
		interactionID: paginationInteractionID,
		paginatorID,
		seed,
		operation: "pick",
	});

	return new ActionRowBuilder().setComponents(new SelectMenuBuilder({ options, custom_id }));
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
	) => [requestedPage: Embed, totalPages: number, selectorOptions?: APISelectMenuOption[]]
> = {};

const finalizers: NodeJS.Dict<
	(selectionNumber: string, seed?: string) => Awaitable<Sendable | Embed>
> = {};

export function createPaginator({
	paginatorName,
	getPageData,
}: {
	paginatorName: string;
	getPageData: (pageNum: number, seed?: string) => [requestedPage: Embed, totalPages: number];
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
	) => [requestedPage: Embed, totalPages: number, selectorOptions: APISelectMenuOption[]];
	finalizer: (selectionNumber: string, seed?: string) => Awaitable<Sendable>;
}) {
	// do one-time setup by enabling pagination (␉) among other component handlers
	componentInteractions[paginationInteractionID] = paginationHandler;

	// register this specific paginator and finalizer
	finalizers[paginatorName] = finalizer;
	paginationSchemes[paginatorName] = getPageData;

	// return the function that initiates this selector
	return (seed?: string) => generateInitialPaginatedSelector(paginatorName, seed, false, true);
}
