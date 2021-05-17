import { Client } from "discord.js";
import { Message } from "discord.js";
import type { ActivityOptions } from "discord.js";
import type { CommandResponse, Constraints, Extras, TriggerResponse } from "../types/types-bot.js";
export declare const startupTimestamp: Date;
export declare const client: Client;
/** resolves when the client has connected */
export declare let clientReady: Promise<Client>;
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
declare let activities: ActivityOptions[];
/**
 * add 1 or more discord presence statuses to cycle through
 */
export declare function addActivity(...activities_: (string | ActivityOptions)[]): void;
/**
 * completely replaces existing `activities` statuses. you probably want `addActivity` instead
 */
export declare function setActivities(activities_: typeof activities): void;
declare let onConnects: ((client_: Client) => void)[];
/**
 * add function(s) to run upon first logging into discord
 *
 * the discord client will be passed as an arg
 */
export declare function addOnConnect(...onConnect_: typeof onConnects): void;
/** completely replaces existing `onConnect` functions. prefer `addOnConnect` */
export declare function setOnConnect(onConnects_: typeof onConnects): void;
declare let onReconnects: ((client_: Client) => void)[];
/**
 * add function(s) to run upon any reconnection to discord
 *
 * the discord client will be passed as an arg
 */
export declare function addOnReconnect(...onReconnect_: typeof onReconnects): void;
/** completely replaces existing `onReconnect` functions. prefer `addOnReconnect` */
export declare function setOnReconnect(onReconnect_: typeof onReconnects): void;
export declare function ignoreServerId(...serverIds: (string | string[])[]): void;
export declare function ignoreUserId(...userIds: (string | string[])[]): void;
declare type MessageFilter = (msg: Message) => boolean;
export declare function addMessageFilter(...messageFilter: MessageFilter[]): void;
export declare function ignoreDms(setting?: boolean): void;
/** starts the client up. resolves (to the client) when the client has connected/is ready */
export declare function init(token: string): Promise<Client>;
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
export {};
