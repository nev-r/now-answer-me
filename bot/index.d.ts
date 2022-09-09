import { Client } from "discord.js";
import type { ActivityOptions } from "discord.js";
export { addSlashCommand, } from "./slash-commands.js";
export { createComponentButtons, createComponentSelects } from "./message-components.js";
export { registerModal } from "./modals.js";
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
 * completely replaces existing `activities` statuses. you may want `addActivity` instead
 */
export declare function setActivities(activities_: typeof activities): void;
declare let onConnects: ((client_: Client) => Promise<void> | void)[];
/**
 * add function(s) to run upon first logging into discord
 */
export declare function addOnConnect(...onConnect_: typeof onConnects): void;
declare let onReconnects: ((client_: Client) => void)[];
/**
 * add function(s) to run upon any reconnection to discord
 */
export declare function addOnReconnect(...onReconnect_: typeof onReconnects): void;
declare let onReadies: ((client_: Client) => Promise<void> | void)[];
/**
 * add function(s) to run after bot is ready
 * (startup tasks are completed, slash commands are registered)
 */
export declare function addOnReady(...onReady_: typeof onReadies): void;
export declare function ignoreServerId(...serverIds: (string | string[])[]): void;
export declare function ignoreUserId(...userIds: (string | string[])[]): void;
/** starts the client up. resolves (to the client) when the client has connected/is ready */
export declare function init(token: string): Promise<Client<boolean>>;
