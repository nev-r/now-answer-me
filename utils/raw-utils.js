//
// client-agnostic functions for use with bot or static methods
//
import { arrayify } from "one-stone/array";
import { sleep } from "one-stone/promise";
import { normalizeID } from "./data-normalization.js";
import { sendableToMessageOptions } from "./misc.js";
export function buildEmojiDictUsingClient(client, guilds) {
    guilds = Array.isArray(guilds) ? guilds : [guilds];
    const results = {};
    for (const guild of guilds) {
        const emojis = client.guilds.resolve(guild)?.emojis.cache;
        emojis?.forEach((emoji) => {
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
    if (!resolvedChannel.isTextBased())
        throw new Error(`channel ${channel} is not a text channel`);
    if (publish && resolvedChannel.isNews())
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
    await messageToEdit.edit(typeof content === "string" ? content : { embeds: [content.data] });
    return messageToEdit;
}
export async function publishMessageUsingClient(client, channel, message) {
    const resolvedChannel = await client.channels.fetch(normalizeID(channel));
    if (!resolvedChannel)
        throw new Error(`${channel} could not be resolved to a channel this account has access to`);
    if (!resolvedChannel.isTextBased())
        throw new Error(`channel ${channel} is not a text channel`);
    if (!resolvedChannel.isNews())
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
            }
        }
        currentlyAvailableEmoji = await buildEmojiDictUsingClient(client, storageServer);
        if (toUpload.every((e) => e in currentlyAvailableEmoji)) {
            for (const n in currentlyAvailableEmoji)
                if (!toUpload.includes(n))
                    delete currentlyAvailableEmoji[n];
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
        return ((channel?.isDM() || channel?.isTextBased()) && channel.send(sendableToMessageOptions(message)));
    });
}
export async function replyOrEdit(interaction, content) {
    if (interaction.replied) {
        console.log(`interaction [${interaction.commandName}] was already replied to. would have replied [${content}]`);
    }
    else
        await (interaction.deferred ? interaction.editReply(content) : interaction.reply(content));
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
export async function forceFeedback(interaction, content) {
    if (interaction.replied)
        await interaction.followUp(content);
    if (interaction.deferred)
        await interaction.editReply(content);
    await interaction.reply(content);
}
