import { Message } from "discord.js";
import type { CommandResponse, Constraints, Extras, TriggerResponse } from "../types/types-bot.js";
/**
 * set the command prefix (i.e. "!"" or "?"" or whatever)
 *
 * @param prefix a string will be used literally. a regex can be used instead,
 * but it needs to be carefully formatted, including (likely) a `^`, and needs
 * named `(<command>` and `(<args>` subpatterns
 *
 * ideally, use a string prefix because it's going to be a lot faster to check
 * startsWith, instead of executing a regex on every message that goes by
 */
export declare function setPrefix(prefix: string | RegExp): void;
declare const commands: ({
    command: string | string[];
    response: CommandResponse;
} & Constraints & Extras)[];
/**
 * either a Sendable, or a function that generates a Sendable.
 * if it's a function, it's passed the TriggerParams object
 */
export declare function addCommand(...commands_: typeof commands): void;
declare const triggers: ({
    trigger: RegExp;
    response: TriggerResponse;
} & Constraints & Extras)[];
/**
 * either a Sendable, or a function that generates a Sendable.
 * if it's a function, it's passed the TriggerParams object
 */
export declare function addTrigger(...triggers_: typeof triggers): void;
export declare function routeMessageCommand(msg: Message): Promise<void>;
export {};
