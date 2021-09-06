import { Client } from "discord.js";
import { Message } from "discord.js";
import type { ActivityOptions } from "discord.js";
export { addCommand, addTrigger, setPrefix } from "./message-commands.js";
export { addSlashCommand } from "./slash-commands.js";
export { createComponentButtons } from "./message-components.js";
export declare const startupTimestamp: Date;
export declare const client: Client<boolean>;
/** resolves when the client has connected */
export declare let clientReady: Promise<Client>;
export declare const clientStatus: {
    hasConnected: boolean;
    performReconnects: boolean;
};
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
export declare function init(token: string): Promise<Client<boolean>>;
