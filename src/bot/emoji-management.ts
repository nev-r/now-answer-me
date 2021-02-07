//
// some slight shortcuts
//

import type { GuildResolvable } from "discord.js";
import { client, clientReady } from "./index.js";
import { buildEmojiDictUsingClient, uploadEmojisUsingClient } from "../utils/raw-utils.js";

/**
 * waits for client to be ready and then builds an emoji dict from a server or array of servers
 */
export async function buildEmojiDict(guilds: GuildResolvable[]) {
	await clientReady;
	return buildEmojiDictUsingClient(client, guilds);
}

/**
 * waits for client to be ready and then uploads some emoji
 */
export async function uploadEmojis(
	guild: GuildResolvable,
	emojis: Parameters<typeof uploadEmojisUsingClient>[2]
) {
	await clientReady;
	return uploadEmojisUsingClient(client, guild, emojis);
}
