import type { Message } from "discord.js";
/** try to do whatever func wants to do, but delete msg if there's an error */
export declare function bugOut<T extends any>(msg: Message | undefined, func: (() => T) | (() => Promise<T>)): Promise<T>;
export declare function delMsg(msg?: Message): Promise<void>;
export declare function boolFilter<T>(arr: T[]): NonNullable<T>[];
