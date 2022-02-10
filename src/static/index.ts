import type {
	BufferResolvable,
	ChannelResolvable,
	GuildResolvable,
	Embed,
	MessageResolvable,
} from "discord.js";
import {
	buildEmojiDictUsingClient,
	editMessageUsingClient,
	publishMessageUsingClient,
	sendMessageUsingClient,
	uploadEmojisUsingClient,
} from "../utils/raw-utils.js";
import { doSomethingUsingTempClient } from "../utils/temp-client.js";

/**
 * logs into discord, sends a message to a specific channel, and logs out.
 * optionally crossposts/publishes it
 *
 * returns the message that was sent
 */
export async function sendSingleMessage(
	apiToken: string,
	channel: ChannelResolvable,
	content: string | Embed,
	publish?: boolean
) {
	return doSomethingUsingTempClient(apiToken, async (client) => {
		return sendMessageUsingClient(client, channel, content, publish);
	});
}

/**
 * logs into discord, publishes an existing message found in a specific channel, and logs out
 *
 * returns the message that was published
 */
export async function publishSingleMessage(
	apiToken: string,
	channel: ChannelResolvable,
	message: MessageResolvable
) {
	return doSomethingUsingTempClient(apiToken, async (client) => {
		return publishMessageUsingClient(client, channel, message);
	});
}

/**
 * logs into discord, sends a message to a specific channel, and logs out
 *
 * returns the message that was edited
 */
export async function editSingleMessage(
	apiToken: string,
	channel: ChannelResolvable,
	messageId: MessageResolvable,
	content: string | Embed
) {
	return doSomethingUsingTempClient(apiToken, async (client) => {
		return editMessageUsingClient(client, channel, messageId, content);
	});
}

/**
 * logs into discord, and builds an emoji dict from a server or array of servers
 *
 * returns the emoji dict
 */
export async function staticBuildEmojiDict(
	apiToken: string,
	guilds: GuildResolvable | GuildResolvable[]
) {
	guilds = Array.isArray(guilds) ? guilds : [guilds];
	return doSomethingUsingTempClient(apiToken, (client) => {
		return buildEmojiDictUsingClient(client, guilds);
	});
}

/**
 * makes sure an array of emoji is all uploaded to a server. doesnt delete to make room though, so. unreliable.
 *
 * returns the emoji dict
 */
export async function uploadEmojis(
	apiToken: string,
	guild: GuildResolvable,
	emojis: { attachment: BufferResolvable; name: string }[]
) {
	return doSomethingUsingTempClient(apiToken, (client) => {
		return uploadEmojisUsingClient(client, guild, emojis);
	});
}
