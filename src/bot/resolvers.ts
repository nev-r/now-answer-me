//
// delayed resolvers
//

import type { Channel, ChannelResolvable, EmojiResolvable, GuildResolvable } from "discord.js";
import { client, clientReady } from "./index.js";

/**
 * waits for client to be ready and then attempts to resolve a channel
 */
export async function resolveChannel<T extends Channel>(channel: ChannelResolvable) {
	await clientReady;
	return client.channels.resolve(channel) as T | null;
}

/**
 * waits for client to be ready and then attempts to resolve an emoji
 */
export async function resolveEmoji(emoji: EmojiResolvable) {
	await clientReady;
	return client.emojis.resolve(emoji);
}

/**
 * waits for client to be ready and then attempts to resolve a guild
 */
export async function resolveGuild(guild: GuildResolvable) {
	await clientReady;
	return client.guilds.resolve(guild);
}
