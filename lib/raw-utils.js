export async function buildEmojiDictUsingClient(client, guilds) {
    var _a;
    guilds = Array.isArray(guilds) ? guilds : [guilds];
    const results = {};
    for (const guild of guilds) {
        const emojis = (_a = client.guilds.resolve(guild)) === null || _a === void 0 ? void 0 : _a.emojis.cache;
        emojis === null || emojis === void 0 ? void 0 : emojis.forEach((emoji) => (results[emoji.name] = emoji));
    }
    return results;
}
export async function sendMessageUsingClient(client, channel, content, publish) {
    const resolvedChannel = client.channels.resolve(channel);
    if (!resolvedChannel)
        throw new Error(`${channel} could not be resolved to a channel this account has access to`);
    if (!resolvedChannel.isText())
        throw new Error(`channel ${channel} is not a text channel`);
    if (publish && resolvedChannel.type !== "news")
        throw new Error(`cannot publish. channel ${channel} is not a news/announcement channel`);
    const sentMessage = await resolvedChannel.send(content);
    if (publish)
        await sentMessage.crosspost();
    client.destroy();
    return sentMessage;
}
export async function editMessageUsingClient(client, channel, message, content) {
    message = typeof message === "string" ? message : message.id;
    const resolvedChannel = client.channels.resolve(channel);
    if (!resolvedChannel)
        throw new Error(`${channel} could not be resolved to a channel this account has access to`);
    if (!resolvedChannel.isText())
        throw new Error(`channel ${channel} is not a text channel`);
    const messageToEdit = await resolvedChannel.messages.fetch(message);
    if (!messageToEdit)
        throw new Error(`couldn't find message ${message} in channel ${resolvedChannel}`);
    await messageToEdit.edit(content);
    return messageToEdit;
}
export async function publishMessageUsingClient(client, channel, message) {
    message = typeof message === "string" ? message : message.id;
    const resolvedChannel = client.channels.resolve(channel);
    if (!resolvedChannel)
        throw new Error(`${channel} could not be resolved to a channel this account has access to`);
    if (!resolvedChannel.isText())
        throw new Error(`channel ${channel} is not a text channel`);
    if (resolvedChannel.type !== "news")
        throw new Error(`cannot publish. channel ${channel} is not a news/announcement channel`);
    const messageToPublish = await resolvedChannel.messages.fetch(message);
    if (!messageToPublish)
        throw new Error(`couldn't find message ${message} in channel ${channel}`);
    await messageToPublish.crosspost();
    return messageToPublish;
}
export async function uploadEmojiListUsingClient(client, guild, emoteList) {
    const toUpload = emoteList.map((e) => e.name);
    const storageServer = client.guilds.resolve(guild);
    if (!storageServer)
        throw new Error("storage server not resolved");
    let currentlyAvailableEmoji = await buildEmojiDictUsingClient(client, storageServer);
    let tryCounter = 0;
    while (true) {
        for (const emote of emoteList) {
            if (!currentlyAvailableEmoji[emote.name]) {
                console.log(`uploading emote for ${emote.name}`);
                await storageServer.emojis.create(emote.attachment, emote.name);
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
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function sleepUntil(date) {
    if (typeof date === "number")
        date = new Date(date);
    const waitTime = date.getTime() - Date.now();
    if (waitTime < 0)
        throw new Error(`${date.toLocaleString} is in the past!`);
    await sleep(waitTime);
}