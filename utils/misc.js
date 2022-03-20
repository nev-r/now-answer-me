//
// delayed resolvers
//
import { Embed, } from "discord.js";
/** try to do whatever func wants to do, but delete msg if there's an error */
export async function bugOut(msg, func) {
    try {
        return await func();
    }
    catch (e) {
        await delMsg(msg);
        throw e;
    }
}
export async function delMsg(msg) {
    try {
        msg?.deletable && (await msg.delete());
    }
    catch (e) {
        console.log(e);
    }
    return;
}
/** deprecated i guess */
export async function sendMsg(channel, sendable) {
    let toSend;
    if (sendable instanceof Embed)
        toSend = { embeds: [sendable] };
    else if (typeof sendable === "string")
        toSend = { content: sendable };
    else
        toSend = sendable;
    return channel.send(toSend);
}
// {
//   tts?: boolean;
//   nonce?: string | number;
//   content?: string | null;
//   embeds?: (JSONEncodable<APIEmbed> | APIEmbed)[];
//   components?: (
//     | JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent>>
//     | ActionRow<MessageActionRowComponent>
//     | (Required<BaseComponentData> & ActionRowData<MessageActionRowComponentData | MessageActionRowComponent>)
//     | APIActionRowComponent<APIMessageActionRowComponent>
//   )[];
//   allowedMentions?: MessageMentionOptions;
//   files?: (FileOptions | BufferResolvable | Stream | MessageAttachment)[];
//   reply?: ReplyOptions;
//   stickers?: StickerResolvable[];
//   attachments?: MessageAttachment[];
//   flags?: BitFieldResolvable<Extract<MessageFlagsString, 'SuppressEmbeds'>, number>;
// }
export function sendableToMessageOptions(sendable) {
    if (sendable instanceof Embed)
        return { embeds: [sendable.data] };
    else if (typeof sendable === "string")
        return { content: sendable };
    else {
        const { content, embeds, components, files } = sendable;
        const embeds2 = embeds?.map((e) => ("toJSON" in e ? e.toJSON() : e));
        return { content, embeds: embeds2, components, files };
    }
}
export function sendableToInteractionReplyOptions(sendable) {
    if (sendable instanceof Embed)
        return { embeds: [sendable] };
    else if (typeof sendable === "string")
        return { content: sendable };
    else
        return sendable;
}
export function sendableToInteractionUpdateOptions(sendable) {
    if (sendable instanceof Embed)
        return { embeds: [sendable] };
    else if (typeof sendable === "string")
        return { content: sendable };
    else
        return {
            ...sendable,
            embeds: sendable.embeds?.map((e) => ("toJSON" in e ? e.toJSON() : e)),
            flags: undefined,
        };
}
export function sendableToPayload(sendable) {
    if (sendable instanceof Embed)
        return { embeds: [sendable] };
    else if (typeof sendable === "string")
        return { content: sendable };
    else
        return sendable;
}
export function boolFilter(arr) {
    return arr.filter(Boolean);
}
