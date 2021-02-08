//
// things which will self-manage after sending
//

import type {
	Message,
	TextChannel,
	DMChannel,
	NewsChannel,
	User,
	EmbedFieldData,
} from "discord.js";
import { MessageEmbed } from "discord.js";
import { sleep } from "one-stone/promise";
import { bugOut, delMsg } from "../utils/misc.js";
import { presentOptions } from "../utils/user-input.js";

const adjustDirections = { "⬅️": -1, "➡️": 1 };
const directions = Object.keys(adjustDirections) as (keyof typeof adjustDirections)[];
const random = "🎲";
const dirsAndRandom = [...directions, random] as (typeof directions[number] | typeof random)[];
const trash = "🚮";

/**
 * accepts a channel to post to, and a collection of pages to
 * let users switch between
 *
 * in this implementation, each page is a MessageEmbed
 */
export async function sendPaginatedEmbed<T>(
	_: (
		| {
				preexistingMessage?: undefined;
				channel: TextChannel | DMChannel | NewsChannel;
		  }
		| {
				preexistingMessage: Message;
				channel?: undefined;
		  }
	) & {
		pages: MessageEmbed[];
		renderer?: undefined;
		startPage?: number;
	}
): Promise<Message>;
/**
 * accepts a channel to post to, and a collection of pages to
 * let users switch between
 *
 * in this implementation each page is source data for a
 * renderer function, which turns a page into a MessageEmbed
 *
 * this can be used to defer heavy or async page rendering,
 * until that page is navigated to
 */
export async function sendPaginatedEmbed<T>(
	_: (
		| {
				preexistingMessage?: undefined;
				channel: TextChannel | DMChannel | NewsChannel;
		  }
		| {
				preexistingMessage: Message;
				channel?: undefined;
		  }
	) & {
		pages: T[];
		renderer: (sourceData: T) => MessageEmbed | Promise<MessageEmbed>;
		startPage?: number;
	}
): Promise<Message>;

export async function sendPaginatedEmbed<T>(_: {
	preexistingMessage?: Message;
	channel?: TextChannel | DMChannel | NewsChannel;
	pages: (MessageEmbed | T)[];
	renderer?: (sourceData: any) => MessageEmbed | Promise<MessageEmbed>;
	startPage?: number;
}): Promise<Message> {
	return (await _paginatedEmbedSender_(_)).message;
}

/**
 * accepts a channel to post to, and a collection of "pages" to let users randomly switch between
 *
 * in this implementation, each page is a MessageEmbed
 */
export async function sendRerollableEmbed<T>(_: {
	channel: TextChannel | DMChannel | NewsChannel;
	pages: MessageEmbed[];
	renderer?: undefined;
}): Promise<Message>;
/**
 * accepts a channel to post to, and a collection of "pages" to let users randomly switch between
 *
 * in this implementation each page is source data for a renderer function, which turns a page into a MessageEmbed
 *
 * this can be used to defer heavy or async page rendering, until that page is navigated to
 */
export async function sendRerollableEmbed<T>(_: {
	channel: TextChannel | DMChannel | NewsChannel;
	pages: T[];
	renderer: (sourceData: T) => MessageEmbed | Promise<MessageEmbed>;
}): Promise<Message>;
export async function sendRerollableEmbed<T>(_: {
	channel: TextChannel | DMChannel | NewsChannel;
	pages: (MessageEmbed | T)[];
	renderer?: (sourceData: any) => MessageEmbed | Promise<MessageEmbed>;
}): Promise<Message> {
	return (await _paginatedEmbedSender_({ ..._, randomButton: true, arrowButtons: false })).message;
}

/**
 * accepts a channel to post to, and a collection of "pages" to let users randomly switch between. each page can only be viewed once
 *
 * in this implementation, each page is a MessageEmbed
 */
export async function sendRerollableStackEmbed<T>(_: {
	channel: TextChannel | DMChannel | NewsChannel;
	pages: MessageEmbed[];
	renderer?: undefined;
}): Promise<Message>;
/**
 * accepts a channel to post to, and a collection of "pages" to let users randomly switch between. each page can only be viewed once
 *
 * in this implementation each page is source data for a renderer function, which turns a page into a MessageEmbed
 *
 * this can be used to defer heavy or async page rendering, until that page is navigated to
 */
export async function sendRerollableStackEmbed<T>(_: {
	channel: TextChannel | DMChannel | NewsChannel;
	pages: T[];
	renderer: (sourceData: T) => MessageEmbed | Promise<MessageEmbed>;
}): Promise<Message>;
export async function sendRerollableStackEmbed<T>(_: {
	channel: TextChannel | DMChannel | NewsChannel;
	pages: (MessageEmbed | T)[];
	renderer?: (sourceData: any) => MessageEmbed | Promise<MessageEmbed>;
}): Promise<Message> {
	return (await _paginatedEmbedSender_({ ..._, randomButton: true, arrowButtons: false })).message;
}

// /** accepts a channel to post to, and a collection of pages to let users switch between* if the pages aren't MessageEmbeds, they are page source data, for a renderer function which turns them into MessageEmbeds* this can be used to defer heavy or async page rendering, until that page is navigated to */

// aborting this prevents further pagination but does not clean up its reactions,
// to prevent race conditions from deleting needed reactions
async function _paginatedEmbedSender_<T>({
	preexistingMessage,
	channel = preexistingMessage?.channel,
	renderer = (t: MessageEmbed) => t,
	pages,
	startPage = 0,
	arrowButtons = true,
	randomButton,
	noReturn,
	abortController = { aborted: false },
}: {
	preexistingMessage?: Message;
	channel?: TextChannel | DMChannel | NewsChannel;
	renderer?: (sourceData: any) => MessageEmbed | Promise<MessageEmbed>;
	pages: (MessageEmbed | T)[];
	startPage?: number;
	arrowButtons?: boolean;
	randomButton?: boolean;
	noReturn?: boolean;
	abortController?: { aborted: boolean };
}): Promise<{ message: Message; abortController: { aborted: boolean } }> {
	if (!channel) throw new Error("no channel provided to send pagination to");

	// we might modify this array, so copy it
	pages = Array.from(pages);
	let currentPage = startPage;
	if (!pages) {
		pages;
	}

	let embed = await renderer(pages[currentPage]);
	if (pages.length > 1 && embed.footer === null) {
		embed.setFooter(
			noReturn ? `${pages.length - 1} remaining` : `${currentPage + 1} / ${pages.length}`
		);
	}

	const paginatedMessage = preexistingMessage
		? await preexistingMessage.edit(embed)
		: await channel.send(embed);

	// not awaiting this bugOut dispatches it, to monitor the message
	// asynchronously while sendPaginatedEmbed returns the paginatedMessage
	bugOut(paginatedMessage, async () => {
		// if there's pages to switch between, enter a loop of listening for input
		let userInput: typeof directions[number] | typeof random | typeof trash | undefined;

		("messageDelete");

		const reactOptions =
			arrowButtons && randomButton
				? dirsAndRandom
				: arrowButtons
				? directions
				: randomButton
				? random
				: undefined;
		while (
			!abortController?.aborted &&
			// make sure the message is still there
			((!paginatedMessage.deleted &&
				// show pagination if there's pages to move between
				pages.length > 1 &&
				// keep looping as long as user is clicking in a timely fashion i guess
				reactOptions &&
				(userInput = await presentOptions(
					paginatedMessage,
					reactOptions,
					"all",
					undefined,
					abortController
				))) ||
				// if there's 1 page left and we're in noReturn mode
				(pages.length === 1 &&
					noReturn &&
					// suggest deletion
					(userInput = await presentOptions(
						paginatedMessage,
						trash,
						"others",
						undefined,
						abortController
					))))
		) {
			if (abortController?.aborted) return;
			if (noReturn) {
				pages.splice(currentPage, 1);
				// removing current position effectively advances the page by 1, so undo it
				if (userInput === "➡️") {
					currentPage--;
				}
			}

			if (userInput === trash) {
				// user is done. maybe the message will dump itself.
				// allow the deleted property to update then break loop
				await sleep(200);
				break;
			}
			// adjust the page accordingly
			else if (userInput === random) {
				currentPage = Math.floor(Math.random() * pages.length);
			} else {
				currentPage += adjustDirections[userInput];
				if (currentPage + 1 > pages.length) currentPage = 0;
				if (currentPage < 0) currentPage = pages.length - 1;
			}

			// and update the message with the new embed
			embed = await renderer(pages[currentPage]);
			if (embed.footer === null)
				embed.setFooter(
					noReturn ? `${pages.length - 1} remaining` : `${currentPage + 1} / ${pages.length}`
				);

			await paginatedMessage.edit(embed);
		}
		// loop breaks when there's no more input.
		// let's remove the pagination footer (if we were using it to count)
		// and perform one last edit (if the message is still there)
		if (embed.footer?.text?.match(/^\d+ \/ \d+$/) || embed.footer?.text?.match(/^\d+ remaining$/))
			embed.footer = null;
		paginatedMessage.deleted || (await paginatedMessage.edit(embed));
	});

	return { message: paginatedMessage, abortController };
}

/**
 * accepts a channel to post to, a list of `T`s, and a function that turns a `T` into a valid element of a `MessageEmbed` field
 */
export async function sendPaginatedSelector<T>({
	preexistingMessage,
	user,
	channel,
	selectables,
	optionRenderer = (l, i) => ({ name: i, value: `${l}`, inline: true }),
	resultRenderer = (l) => new MessageEmbed({ description: `${l}` }),
	resultAction = async (s, c) => {
		await s.edit(await resultRenderer(c));
	},
	prompt = "choose by responding with a number:",
	itemsPerPage = 25,
}: {
	preexistingMessage?: Message;
	user: User;
	channel: TextChannel | DMChannel | NewsChannel;
	selectables: T[];
	optionRenderer: (listItem: T, index: number) => EmbedFieldData;
	resultRenderer?: (listItem: T) => Promise<MessageEmbed> | MessageEmbed;
	resultAction?: (selectorMessage: Message, choice: T) => Promise<void> | void;
	prompt?: string;
	itemsPerPage?: number;
}) {
	const numPages = Math.ceil(selectables.length / itemsPerPage);

	const pages = [...Array(numPages)].map((x, pageNum) => {
		const pageEmbed = new MessageEmbed({
			fields: selectables
				.slice(pageNum * itemsPerPage, (pageNum + 1) * itemsPerPage)
				.map((t, i) => optionRenderer(t, pageNum * itemsPerPage + i + 1)),
		});
		prompt && pageEmbed.setDescription(prompt);
		numPages > 1 && pageEmbed.setFooter(`${pageNum + 1} / ${numPages}`);
		return pageEmbed;
	});

	const abortController = { aborted: false };

	const selectorMessage = (
		await _paginatedEmbedSender_({
			pages,
			preexistingMessage,
			channel,
			abortController,
		})
	).message;

	// not awaiting this bugOut dispatches it, to monitor the message
	// asynchronously while sendPaginatedSelector returns the selectorMessage
	bugOut(selectorMessage, async () => {
		// this continually listens for a numeric choice
		const choiceDetector = (async () => {
			const choiceMessage = (
				await channel.awaitMessages(
					(m: Message) => {
						if (m.author.id !== user.id || !/^\d+$/.test(m.content)) return false;
						const index = Number(m.content);
						return index > 0 && index <= selectables.length;
					},
					{ max: 1, time: 300000 }
				)
			).first();
			if (choiceMessage) {
				await delMsg(choiceMessage);
				return Number(choiceMessage.content);
			}
		})();

		const userInput = await choiceDetector;

		if (userInput) {
			abortController.aborted = true;
			await selectorMessage.reactions.removeAll();
			await sleep(800);
			resultAction(selectorMessage, selectables[userInput - 1]);
		}
	});
}
