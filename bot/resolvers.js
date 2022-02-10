//
// delayed resolvers
//
import { client, clientReady } from "./index.js";
/**
 * waits for client to be ready and then attempts to resolve a channel
 */
export async function resolveChannel(channel) {
    await clientReady;
    return (client.channels.resolve(channel) ||
        (typeof channel === "string" ? client.channels.fetch(channel) : null));
}
/**
 * waits for client to be ready and then attempts to resolve an emoji
 */
export async function resolveEmoji(emoji) {
    await clientReady;
    return client.emojis.resolve(emoji);
}
/**
 * waits for client to be ready and then attempts to resolve a guild
 */
export async function resolveGuild(guild) {
    await clientReady;
    return client.guilds.resolve(guild);
}
