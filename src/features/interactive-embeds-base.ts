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
import { serialReactions } from "../utils/message-actions.js";
import { bugOut, delMsg } from "../utils/misc.js";
import { serialReactionMonitor } from "../utils/reactionHelpers.js";

const adjustDirections = { "⬅️": -1, "➡️": 1 };
const arrows = ObjectKeys(adjustDirections);
const random = "🎲" as const;
const trash = "🚮";

const reactOptions = {
	arrows,
	random: [random],
	arrowsRandom: [...arrows, random],
};

export async function _newPaginatedSelector_<T>({
	user,
	preexistingMessage,
	channel = preexistingMessage?.channel,
	cleanupReactions = false,
	optionRenderer,
	selectables,
	startPage = 0,
	buttons = "arrows",
	prompt = "choose by responding with a number:",
	itemsPerPage = 18,
	timeToWait = 180000,
}: {
	user?: User;
	preexistingMessage?: Message;
	channel?: TextChannel | DMChannel | NewsChannel;
	cleanupReactions?: boolean;
	optionRenderer?: (listItem: any, index: number) => EmbedFieldData;
	selectables: (T | EmbedFieldData)[];
	startPage?: number;
	buttons?: keyof typeof reactOptions;
	prompt?: string;
	itemsPerPage?: number;
	timeToWait?: number;
}) {
	if (!channel) throw new Error("no channel provided to send pagination to");
	const numPages = Math.ceil(selectables.length / itemsPerPage);
	let currentPage = startPage;
	const useOptionRenderer =
		// in upstream overloads, we will gate optionRenderer to "must operate upon <T>"
		optionRenderer ?? // keep optionRenderer if it's already set
		// otherwise,
		(isEmbedFields(selectables) // if selectables are already embeds
			? (o: EmbedFieldData) => o // return them as-is
			: (l, i) => ({ name: `(${i})`, value: `${l}`, inline: true })); // otherwise stringify the value

	const pages = [...Array(numPages)].map((x, pageNum) => {
		const pageEmbed = new MessageEmbed({
			fields: selectables
				.slice(pageNum * itemsPerPage, (pageNum + 1) * itemsPerPage)
				.map((t, i) => useOptionRenderer(t, pageNum * itemsPerPage + i + 1)),
		});
		prompt && pageEmbed.setDescription(prompt);
		numPages > 1 && pageEmbed.setFooter(`${pageNum + 1} / ${numPages}`);
		return pageEmbed;
	});

	let embed = pages[currentPage];
	if (pages.length > 1 && embed.footer === null)
		embed.setFooter(`${currentPage + 1} / ${pages.length}`);

	// either send or edit, our initial message
	const paginatedMessage = preexistingMessage
		? await preexistingMessage.edit(embed)
		: await channel.send(embed);
	// return this message right away so upstream can do things like watch it for reactions

	return {
		paginatedMessage,
		selection: new Promise<number | undefined>(async (resolveSelection) => {
			if (selectables.length === 1) resolveSelection(0);

			const options = reactOptions[buttons];
			if (!options) throw new Error("invalid button options selected");
			let userChoice: undefined | number;

			// const abortController= { abort: false };
			const paginationReactionMonitor = serialReactionMonitor({
				msg: paginatedMessage,
				constraints: { emoji: options, users: user, notUsers: paginatedMessage.client.user! },
				awaitOptions: { time: timeToWait },
			});

			if (pages.length > 1) {
				await serialReactions(paginatedMessage, options);
				await sleep(200);

				// not awaiting this bugOut dispatches it, to monitor the message
				// asynchronously while sendPaginatedEmbed returns the paginatedMessage
				bugOut(paginatedMessage, async () => {
					//
					// if there's pages to switch between, enter a loop of listening for input
					for await (const reaction of paginationReactionMonitor) {
						const userInput = reaction.emoji.name;

						// adjust the page accordingly
						if (userInput === random) {
							currentPage = Math.floor(Math.random() * pages.length);
						} else if (userInput === "⬅️" || userInput === "➡️") {
							currentPage += adjustDirections[userInput];
							if (currentPage + 1 > pages.length) currentPage = 0;
							if (currentPage < 0) currentPage = pages.length - 1;
						}

						// and update the message with the new embed
						embed = pages[currentPage];
						if (embed.footer === null) embed.setFooter(`${currentPage + 1} / ${pages.length}`);

						await paginatedMessage.edit(embed);
					}
					// loop breaks when there's no more input or when a choice was made
				});
			}

			// also, listen for choice text
			const choiceDetector = (async () => {
				const choiceMessage = (
					await channel.awaitMessages(
						(m: Message) => {
							if ((user && m.author.id !== user.id) || !/^\d+$/.test(m.content)) return false;
							const index = Number(m.content);
							return index > 0 && index <= selectables.length;
						},
						{ max: 1, time: timeToWait }
					)
				).first();
				if (choiceMessage) {
					await delMsg(choiceMessage);
					return Number(choiceMessage.content);
				}
			})();
			choiceDetector.then((selection) => {
				userChoice = selection;
				paginationReactionMonitor.return();
				cleanupReactions &&
					sleep(800).then(() => {
						paginatedMessage.reactions.removeAll();
					});
				resolveSelection(selection && selection - 1);
			});
		}),
	};
}

export async function _newPaginatedEmbed_({
	user,
	preexistingMessage,
	channel = preexistingMessage?.channel,
	pages,
	renderer = (e: any) => e,
	startPage = 0,
	buttons = "arrows",
	timeToWait = 180000,
}: {
	user?: User;
	preexistingMessage?: Message;
	channel?: TextChannel | DMChannel | NewsChannel;
	pages: any[];
	renderer?: (sourceData: any) => MessageEmbed | Promise<MessageEmbed>;
	startPage?: number;
	buttons?: keyof typeof reactOptions;
	timeToWait?: number;
}) {
	if (!channel) throw new Error("no channel provided to send pagination to");
	let currentPage = startPage;

	let embed = await renderer(pages[currentPage]);
	if (pages.length > 1 && embed.footer === null)
		embed.setFooter(`${currentPage + 1} / ${pages.length}`);

	const paginatedMessage = preexistingMessage
		? await preexistingMessage.edit(embed)
		: await channel.send(embed);

	return {
		paginatedMessage,
		page: new Promise<number | undefined>(async (resolvePage) => {
			const options = reactOptions[buttons];
			if (!options) throw new Error("invalid button options selected");

			await serialReactions(paginatedMessage, options);
			await sleep(200);

			const paginationReactionMonitor = serialReactionMonitor({
				msg: paginatedMessage,
				constraints: { emoji: options, users: user, notUsers: paginatedMessage.client.user! },
				awaitOptions: { time: timeToWait },
			});

			try {
				await bugOut(paginatedMessage, async () => {
					// if there's pages to switch between, enter a loop of listening for input
					if (pages.length > 1)
						for await (const reaction of paginationReactionMonitor) {
							const userInput = reaction.emoji.name;

							// adjust the page accordingly
							if (userInput === random) {
								currentPage = Math.floor(Math.random() * pages.length);
							} else if (userInput === "⬅️" || userInput === "➡️") {
								currentPage += adjustDirections[userInput];
								if (currentPage + 1 > pages.length) currentPage = 0;
								if (currentPage < 0) currentPage = pages.length - 1;
							}

							// and update the message with the new embed
							embed = await renderer(pages[currentPage]);
							if (embed.footer === null) embed.setFooter(`${currentPage + 1} / ${pages.length}`);

							await paginatedMessage.edit(embed);
						}

					// loop breaks when there's no more input or when a choice was made
					// let's remove the pagination footer (if we were using it to count)
					// and perform one last edit (if the message is still there)
					if (
						embed.footer?.text?.match(/^\d+ \/ \d+$/) ||
						embed.footer?.text?.match(/^\d+ remaining$/)
					)
						embed.footer = null;
					paginatedMessage.deleted || (await paginatedMessage.edit(embed));
					resolvePage(currentPage);
				});
			} catch (e) {
				resolvePage(undefined);
				throw e;
			}
		}),
	};
}

function ObjectKeys<T>(obj: T) {
	return Object.keys(obj) as (keyof T)[];
}

function isEmbedField(thing: any): thing is EmbedFieldData {
	return (
		thing &&
		thing.name &&
		thing.value &&
		(thing.inline === undefined || typeof thing.inline === "boolean")
	);
}
function isEmbedFields(things: any[]): things is EmbedFieldData[] {
	return things.every(isEmbedField);
}

// type MaybePromiseLike<T> = T | PromiseLike<T>;
