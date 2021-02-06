import type { Message } from "discord.js";
/**
 * deletes msg if someone reacts to it with any of
 * wastebasket `🗑`, litter `🚮`, or cancel `🚫`
 *
 * you can directly wrap a d.js send() or its results in this
 */
export declare function makeTrashable(msg: Message | void | Promise<Message | void>, whoCanDelete?: string | string[]): Promise<void>;
/**
 * apply `reactions` to `msg`, in a set order, without complaining about errors
 */
export declare function serialReactions(msg: Message, reactions: string[]): Promise<void>;
/**
 * apply `reaction` to `msg`, without complaining about errors
 */
export declare function singleReaction(msg: Message, reaction: string): Promise<void>;
