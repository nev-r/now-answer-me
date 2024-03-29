import { InteractionReplyOptions, Message, MessageEmbed, MessageOptions } from "discord.js";
import { Sendable } from "../types/types-discord.js";
/** try to do whatever func wants to do, but delete msg if there's an error */
export declare function bugOut<T extends any>(msg: Message | undefined, func: (() => T) | (() => Promise<T>)): Promise<T>;
export declare function delMsg(msg?: Message): Promise<void>;
/** deprecated i guess */
export declare function sendMsg(channel: Message["channel"], sendable: Sendable): Promise<Message<boolean>>;
export declare function sendableToMessageOptions(sendable: Sendable): MessageOptions & {
    split?: false | undefined;
};
export declare function sendableToInteractionReplyOptions(sendable: InteractionReplyOptions | MessageEmbed | string): InteractionReplyOptions;
export declare function boolFilter<T>(arr: T[]): NonNullable<T>[];
