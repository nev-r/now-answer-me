//
// client-agnostic functions for use with bot or static methods
//

import {
	Client,
	ChannelResolvable,
	GuildEmoji,
	GuildResolvable,
	MessageResolvable,
	UserResolvable,
	GuildEmojiManager,
	TextChannel,
	Snowflake,
	CommandInteraction,
	MessageComponentInteraction,
	ChannelType,
	Embed,
	InteractionReplyOptions,
	MessageOptions,
	InteractionUpdateOptions,
} from "discord.js";
import { arrayify } from "one-stone/array";
import { sleep } from "one-stone/promise";
import { Sendable } from "../types/types-discord.js";
import { normalizeID } from "./data-normalization.js";
import { sendableToMessageOptions } from "./misc.js";

export function buildEmojiDictUsingClient(
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
	content: string | Embed,
	publish?: boolean
) {
	const resolvedChannel = await client.channels.fetch(normalizeID(channel));
	if (!resolvedChannel)
		throw new Error(`${channel} could not be resolved to a channel this account has access to`);
	if (!resolvedChannel.isTextBased()) throw new Error(`channel ${channel} is not a text channel`);
	if (publish && resolvedChannel.isNews())
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
	content: string | Embed
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

	if (!resolvedChannel.isTextBased()) throw new Error(`channel ${channel} is not a text channel`);

	if (resolvedChannel.isNews())
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
			}
		}
		currentlyAvailableEmoji = await buildEmojiDictUsingClient(client, storageServer);
		if (toUpload.every((e) => e in currentlyAvailableEmoji)) {
			for (const n in currentlyAvailableEmoji)
				if (!toUpload.includes(n)) delete currentlyAvailableEmoji[n];
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
			(channel?.isDM() || channel?.isTextBased()) && channel.send(sendableToMessageOptions(message))
		);
	});
}

export async function replyOrEdit(
	interaction: CommandInteraction | MessageComponentInteraction,
	content:
		| Parameters<CommandInteraction["reply"]>[0]
		| Parameters<CommandInteraction["editReply"]>[0]
) {
	if (interaction.replied) {
		console.log(
			`interaction [${
				(interaction as any).commandName
			}] was already replied to. would have replied [${content}]`
		);
	} else await (interaction.deferred ? interaction.editReply(content) : interaction.reply(content));
}

// export async function updateComponent(
// 	interaction: MessageComponentInteraction,
// 	content: Parameters<(typeof interaction)['editReply']>[0] |Parameters<(typeof interaction)["update"] >[0]
// 	// content: MessageOptions | InteractionReplyOptions
// ) {
// 	await (interaction.deferred ? interaction.editReply(content) : interaction.update(content));
// }

/**
 * provide in-discord feedback to an interaction,
 * whether that's an initial reply, an edit to a deferral,
 * or a completely separate followup message
 */
export async function forceFeedback(
	interaction: CommandInteraction | MessageComponentInteraction,
	content:
		| Parameters<CommandInteraction["followUp"]>[0]
		| Parameters<CommandInteraction["reply"]>[0]
		| Parameters<CommandInteraction["editReply"]>[0]
) {
	if (interaction.replied) await interaction.followUp(content);
	if (interaction.deferred) await interaction.editReply(content);
	await interaction.reply(content);
}
