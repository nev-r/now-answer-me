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
import { Embed } from "discord.js";
import { _newPaginatedEmbed_, _newPaginatedSelector_ } from "./interactive-embeds-base.js";

/**
 * accepts a channel to post to, and a collection of pages to
 * let users switch between
 *
 * in this implementation, each page is a Embed
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
		pages: Embed[];
		renderer?: undefined;
		startPage?: number;
	}
): Promise<{
	paginatedMessage: Message;
	page: Promise<number | undefined>;
}>;
/**
 * accepts a channel to post to, and a collection of pages to
 * let users switch between
 *
 * in this implementation each page is source data for a
 * renderer function, which turns a page into a Embed
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
		renderer: (sourceData: T) => Embed | Promise<Embed>;
		startPage?: number;
	}
): Promise<{
	paginatedMessage: Message;
	page: Promise<number | undefined>;
}>;

export async function sendPaginatedEmbed<T>(_: {
	preexistingMessage?: Message;
	channel?: TextChannel | DMChannel | NewsChannel;
	pages: (T | Embed)[];
	renderer?: (sourceData: T) => Embed | Promise<Embed>;
	startPage?: number;
}) {
	return await _newPaginatedEmbed_(_);
}

/**
 * accepts a channel to post to, and a collection of "pages" to let users randomly switch between
 *
 * in this implementation, each page is a Embed
 */
export async function sendRerollableEmbed<T>(_: {
	channel: TextChannel | DMChannel | NewsChannel;
	pages: Embed[];
	renderer?: undefined;
}): Promise<Message>;
/**
 * accepts a channel to post to, and a collection of "pages" to let users randomly switch between
 *
 * in this implementation each page is source data for a renderer function, which turns a page into a Embed
 *
 * this can be used to defer heavy or async page rendering, until that page is navigated to
 */
export async function sendRerollableEmbed<T>(_: {
	channel: TextChannel | DMChannel | NewsChannel;
	pages: T[];
	renderer: (sourceData: T) => Embed | Promise<Embed>;
}): Promise<Message>;
export async function sendRerollableEmbed<T>(_: {
	channel: TextChannel | DMChannel | NewsChannel;
	pages: (Embed | T)[];
	renderer?: (sourceData: any) => Embed | Promise<Embed>;
}): Promise<Message> {
	return (await _newPaginatedEmbed_({ ..._, buttons: "random" })).paginatedMessage;
}

/**
 * accepts a channel to post to, and a collection of "pages" to let users randomly switch between. each page can only be viewed once
 *
 * in this implementation, each page is a Embed
 */
export async function sendRerollableStackEmbed<T>(_: {
	channel: TextChannel | DMChannel | NewsChannel;
	pages: Embed[];
	renderer?: undefined;
}): Promise<Message>;
/**
 * accepts a channel to post to, and a collection of "pages" to let users randomly switch between. each page can only be viewed once
 *
 * in this implementation each page is source data for a renderer function, which turns a page into a Embed
 *
 * this can be used to defer heavy or async page rendering, until that page is navigated to
 */
export async function sendRerollableStackEmbed<T>(_: {
	channel: TextChannel | DMChannel | NewsChannel;
	pages: T[];
	renderer: (sourceData: T) => Embed | Promise<Embed>;
}): Promise<Message>;
export async function sendRerollableStackEmbed<T>(_: {
	channel: TextChannel | DMChannel | NewsChannel;
	pages: (Embed | T)[];
	renderer?: (sourceData: any) => Embed | Promise<Embed>;
}): Promise<Message> {
	return (await _newPaginatedEmbed_({ ..._, buttons: "random" })).paginatedMessage;
}

/**
 * accepts a channel to post to or an existing bot-owned message to edit,
 * and a collection of options to let users select from
 *
 * in this implementation, each selectable is already an EmbedField
 * (an object with the keys "name", "value", and optionally "inline")
 */
export async function sendPaginatedSelector<T>(_: {
	user?: User;
	preexistingMessage?: Message;
	channel?: TextChannel | DMChannel | NewsChannel;
	cleanupReactions?: boolean;
	selectables: EmbedFieldData[];
	prompt?: string;
	itemsPerPage?: number;
	waitTime?: number;
}): Promise<{
	paginatedMessage: Message;
	selection: Promise<number | undefined>;
}>;
/**
 * accepts a channel to post to or an existing bot-owned message to edit,
 * and a collection of options to let users select from
 *
 * in this implementation, an optionRenderer is included which can convert
 * a selectable to an EmbedFieldData
 */
export async function sendPaginatedSelector<T>(_: {
	user?: User;
	preexistingMessage?: Message;
	channel?: TextChannel | DMChannel | NewsChannel;
	cleanupReactions?: boolean;
	optionRenderer?: (selectable: T, index: number) => EmbedFieldData;
	selectables: T[];
	prompt?: string;
	itemsPerPage?: number;
	waitTime?: number;
}): Promise<{
	paginatedMessage: Message;
	selection: Promise<number | undefined>;
}>;
export async function sendPaginatedSelector<T>(_: {
	user?: User;
	preexistingMessage?: Message;
	channel?: TextChannel | DMChannel | NewsChannel;
	cleanupReactions?: boolean;
	optionRenderer?: (selectable: any, index: number) => EmbedFieldData;
	selectables: (T | EmbedFieldData)[];
	prompt?: string;
	itemsPerPage?: number;
	waitTime?: number;
}) {
	return await _newPaginatedSelector_(_);
}
