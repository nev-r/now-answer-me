import { sleep } from "one-stone/promise";
import { rawCreateDynamicEmojiManager } from "../utils/raw-emoji-manager.js";
import { buildEmojiDictUsingClient, editMessageUsingClient, publishMessageUsingClient, sendMessageUsingClient, uploadEmojisUsingClient, } from "../utils/raw-utils.js";
import { doSomethingUsingTempClient } from "../utils/temp-client.js";
/**
 * logs into discord, sends a message to a specific channel, and logs out.
 * optionally crossposts/publishes it
 *
 * returns the message that was sent
 */
export async function sendSingleMessage(apiToken, channel, content, publish) {
    return doSomethingUsingTempClient(apiToken, async (client) => {
        return sendMessageUsingClient(client, channel, content, publish);
    });
}
/**
 * logs into discord, publishes an existing message found in a specific channel, and logs out
 *
 * returns the message that was published
 */
export async function publishSingleMessage(apiToken, channel, message) {
    return doSomethingUsingTempClient(apiToken, async (client) => {
        return publishMessageUsingClient(client, channel, message);
    });
}
/**
 * logs into discord, sends a message to a specific channel, and logs out
 *
 * returns the message that was edited
 */
export async function editSingleMessage(apiToken, channel, messageId, content) {
    return doSomethingUsingTempClient(apiToken, async (client) => {
        return editMessageUsingClient(client, channel, messageId, content);
    });
}
/**
 * logs into discord, and builds an emoji dict from a server or array of servers
 *
 * returns the emoji dict
 */
export async function staticBuildEmojiDict(apiToken, guilds) {
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
export async function uploadEmojis(apiToken, guild, emojis) {
    return doSomethingUsingTempClient(apiToken, (client) => {
        return uploadEmojisUsingClient(client, guild, emojis);
    });
}
/**
 * makes sure an array of emoji is all uploaded, potentially across multiple servers.
 *
 * returns the emoji dict
 */
export async function dynamicUploadEmojis(apiToken, guilds, emojis) {
    return doSomethingUsingTempClient(apiToken, async (client) => {
        const uploader = rawCreateDynamicEmojiManager(client, guilds);
        await sleep(3000);
        return uploader(emojis);
    });
}
