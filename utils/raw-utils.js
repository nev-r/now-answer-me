//
// client-agnostic functions for use with bot or static methods
//
import { arrayify } from "one-stone/array";
import { sleep } from "one-stone/promise";
import { normalizeID } from "./data-normalization.js";
import { sendMsg } from "./misc.js";
export async function buildEmojiDictUsingClient(client, guilds) {
    var _a;
    guilds = Array.isArray(guilds) ? guilds : [guilds];
    const results = {};
    for (const guild of guilds) {
        const emojis = (_a = client.guilds.resolve(guild)) === null || _a === void 0 ? void 0 : _a.emojis.cache;
        emojis === null || emojis === void 0 ? void 0 : emojis.forEach((emoji) => {
            if (emoji.name)
                results[emoji.name] = emoji;
        });
    }
    return results;
}
export async function sendMessageUsingClient(client, channel, content, publish) {
    const resolvedChannel = await client.channels.fetch(normalizeID(channel));
    if (!resolvedChannel)
        throw new Error(`${channel} could not be resolved to a channel this account has access to`);
    if (!resolvedChannel.isText())
        throw new Error(`channel ${channel} is not a text channel`);
    if (publish && resolvedChannel.type !== "news")
        throw new Error(`cannot publish. channel ${channel} is not a news/announcement channel`);
    const sentMessage = await resolvedChannel.send(typeof content === "string" ? content : { embeds: [content] });
    if (publish)
        await sentMessage.crosspost();
    client.destroy();
    return sentMessage;
}
export async function getDMChannelUsingClient(client, user) {
    const resolvedUser = await client.users.fetch(normalizeID(user));
    if (!resolvedUser)
        throw new Error(`${resolvedUser} could not be resolved to a user`);
    return await resolvedUser.createDM();
}
export async function editMessageUsingClient(client, channel, message, content) {
    const resolvedChannel = await client.channels.fetch(normalizeID(channel));
    if (!resolvedChannel)
        throw new Error(`${channel} could not be resolved to a channel this account has access to`);
    if (!resolvedChannel.isText())
        throw new Error(`channel ${channel} is not a text channel`);
    const messageToEdit = await resolvedChannel.messages.fetch(normalizeID(message));
    if (!messageToEdit)
        throw new Error(`couldn't find message ${message} in channel ${resolvedChannel}`);
    await messageToEdit.edit(typeof content === "string" ? content : { embeds: [content] });
    return messageToEdit;
}
export async function publishMessageUsingClient(client, channel, message) {
    const resolvedChannel = await client.channels.fetch(normalizeID(channel));
    if (!resolvedChannel)
        throw new Error(`${channel} could not be resolved to a channel this account has access to`);
    if (!resolvedChannel.isText())
        throw new Error(`channel ${channel} is not a text channel`);
    if (resolvedChannel.type !== "news")
        throw new Error(`cannot publish. channel ${channel} is not a news/announcement channel`);
    const messageToPublish = await resolvedChannel.messages.fetch(normalizeID(message));
    if (!messageToPublish)
        throw new Error(`couldn't find message ${message} in channel ${channel}`);
    await messageToPublish.crosspost();
    return messageToPublish;
}
export async function uploadEmojisUsingClient(client, guild, emojis) {
    const toUpload = emojis.map((e) => e.name);
    const storageServer = client.guilds.resolve(guild);
    if (!storageServer)
        throw new Error("storage server not resolved");
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
            return currentlyAvailableEmoji;
        }
        tryCounter++;
        if (tryCounter > 10) {
            console.log("there are missing emojis. retrying.");
            await sleep(60000);
        }
        else {
            throw new Error("failed repeatedly to upload emojis");
        }
    }
}
export function announceToChannels(client, message, channelIds) {
    return arrayify(channelIds).map((channelId) => {
        const channel = client.channels.cache.get(channelId);
        return (((channel === null || channel === void 0 ? void 0 : channel.type) === "dm" || (channel === null || channel === void 0 ? void 0 : channel.type) === "text") &&
            sendMsg(channel, message));
    });
}
