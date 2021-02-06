//
// some slight shortcuts
//
import { client, clientReady } from "../bot.js";
import { buildEmojiDictUsingClient, uploadEmojisUsingClient } from "../_utils/raw-utils.js";
/**
 * waits for client to be ready and then builds an emoji dict from a server or array of servers
 */
export async function buildEmojiDict(guilds) {
    await clientReady;
    return buildEmojiDictUsingClient(client, guilds);
}
/**
 * waits for client to be ready and then uploads some emoji
 */
export async function uploadEmojis(guild, emojis) {
    await clientReady;
    return uploadEmojisUsingClient(client, guild, emojis);
}
