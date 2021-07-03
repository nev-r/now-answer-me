//
// client-agnostic functions for use with bot or static methods
//

import type {
	Client,
	ChannelResolvable,
	GuildEmoji,
	GuildResolvable,
	MessageEmbed,
	MessageResolvable,
	UserResolvable,
	GuildEmojiManager,
	TextChannel,
	Snowflake,
} from "discord.js";
import { arrayify } from "one-stone/array";
import { sleep } from "one-stone/promise";
import { Sendable } from "../types/types-discord.js";
import { normalizeID } from "./data-normalization.js";
import { sendMsg } from "./misc.js";

export async function buildEmojiDictUsingClient(
	client: Client,
	guilds: GuildResolvable | GuildResolvable[]
) {
	guilds = Array.isArray(guilds) ? guilds : [guilds];
	const results: NodeJS.Dict<GuildEmoji> = {};
	for (const guild of guilds as GuildResolvable[]) {
		const emojis = client.guilds.resolve(guild)?.emojis.cache;
		emojis?.forEach((emoji) => {
			if (emoji.name) results[emoji.name] = emoji;
		});
	}
	return results;
}

export async function sendMessageUsingClient(
	client: Client,
	channel: ChannelResolvable,
	content: string | MessageEmbed,
	publish?: boolean
) {
	const resolvedChannel = await client.channels.fetch(normalizeID(channel));
	if (!resolvedChannel)
		throw new Error(`${channel} could not be resolved to a channel this account has access to`);
	if (!resolvedChannel.isText()) throw new Error(`channel ${channel} is not a text channel`);
	if (publish && resolvedChannel.type !== "news")
		throw new Error(`cannot publish. channel ${channel} is not a news/announcement channel`);
	const sentMessage = await resolvedChannel.send(
		typeof content === "string" ? content : { embeds: [content] }
	);
	if (publish) await sentMessage.crosspost();
	client.destroy();
	return sentMessage;
}

export async function getDMChannelUsingClient(client: Client, user: UserResolvable) {
	const resolvedUser = await client.users.fetch(normalizeID(user));
	if (!resolvedUser) throw new Error(`${resolvedUser} could not be resolved to a user`);

	return await resolvedUser.createDM();
}

export async function editMessageUsingClient(
	client: Client,
	channel: ChannelResolvable,
	message: MessageResolvable,
	content: string | MessageEmbed
) {
	const resolvedChannel = await client.channels.fetch(normalizeID(channel));
	if (!resolvedChannel)
		throw new Error(`${channel} could not be resolved to a channel this account has access to`);
	if (!resolvedChannel.isText()) throw new Error(`channel ${channel} is not a text channel`);
	const messageToEdit = await resolvedChannel.messages.fetch(normalizeID(message));
	if (!messageToEdit)
		throw new Error(`couldn't find message ${message} in channel ${resolvedChannel}`);
	await messageToEdit.edit(typeof content === "string" ? content : { embeds: [content] });
	return messageToEdit;
}

export async function publishMessageUsingClient(
	client: Client,
	channel: ChannelResolvable,
	message: MessageResolvable
) {
	const resolvedChannel = await client.channels.fetch(normalizeID(channel));
	if (!resolvedChannel)
		throw new Error(`${channel} could not be resolved to a channel this account has access to`);

	if (!resolvedChannel.isText()) throw new Error(`channel ${channel} is not a text channel`);

	if (resolvedChannel.type !== "news")
		throw new Error(`cannot publish. channel ${channel} is not a news/announcement channel`);

	const messageToPublish = await resolvedChannel.messages.fetch(normalizeID(message));
	if (!messageToPublish) throw new Error(`couldn't find message ${message} in channel ${channel}`);

	await messageToPublish.crosspost();
	return messageToPublish;
}

type EmojiAttachment = Parameters<GuildEmojiManager["create"]>[0];
type EmojiName = Parameters<GuildEmojiManager["create"]>[1];
export async function uploadEmojisUsingClient(
	client: Client,
	guild: GuildResolvable,
	emojis: { attachment: EmojiAttachment; name: EmojiName }[]
) {
	const toUpload = emojis.map((e) => e.name);
	const storageServer = client.guilds.resolve(guild);
	if (!storageServer) throw new Error("storage server not resolved");
	let currentlyAvailableEmoji = await buildEmojiDictUsingClient(client, storageServer);

	let tryCounter = 0;
	while (true) {
		for (const emoji of emojis) {
			if (!currentlyAvailableEmoji[emoji.name]) {
				console.log(`uploading emoji for ${emoji.name}`);
				await storageServer.emojis.create(emoji.attachment, emoji.name);
				await sleep(6000);
			}
		}
		currentlyAvailableEmoji = await buildEmojiDictUsingClient(client, storageServer);
		if (toUpload.every((e) => e in currentlyAvailableEmoji)) {
			return currentlyAvailableEmoji as Record<string, GuildEmoji>;
		}
		tryCounter++;
		if (tryCounter > 10) {
			console.log("there are missing emojis. retrying.");
			await sleep(60000);
		} else {
			throw new Error("failed repeatedly to upload emojis");
		}
	}
}

export function announceToChannels(
	client: Client,
	message: Sendable,
	channelIds: Snowflake | Snowflake[]
) {
	return arrayify(channelIds).map((channelId) => {
		const channel = client.channels.cache.get(channelId);
		return (
			(channel?.type === "dm" || channel?.type === "text") &&
			sendMsg(channel as TextChannel, message)
		);
	});
}
