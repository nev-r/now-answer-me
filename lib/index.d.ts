import Discord, { MessageAdditions, MessageOptions } from "discord.js";
export * from "./util.js";
export declare const startupTimestamp: Date;
export declare const client: Discord.Client;
export declare const clientReadyPromise: Promise<unknown>;
export declare let clientReady: boolean;
export declare let prefix: string;
export declare function setPrefix(prefix_: string): void;
export declare let testPrefix: string;
export declare function setTestPrefix(testPrefix_: string): void;
export declare let env: "test" | "production";
/**
 * `'test'|false` for test env,
 * `'production'|true` for production
 */
export declare function setEnv(env_: typeof env | boolean): void;
export declare function setupCommandRegex(): void;
declare let activities: Discord.ActivityOptions[];
/**
 * add discord presence statuses to cycle through
 */
export declare function addActivity(...activities_: (string | Discord.ActivityOptions)[]): void;
/** completely replaces existing `activities` statuses. you may want `addActivity` */
export declare function setActivities(activities_: typeof activities): void;
declare let onConnects: ((client_: Discord.Client) => void)[];
/**
 * add function(s) to run upon first logging into discord
 *
 * the discord client will be passed as an arg
 */
export declare function addOnConnect(...onConnect_: typeof onConnects): void;
/** completely replaces existing `onConnect` functions. prefer `addOnConnect` */
export declare function setOnConnects(onConnects_: typeof onConnects): void;
declare let onReconnects: ((client_: Discord.Client) => void)[];
/**
 * add function(s) to run upon any reconnection to discord
 *
 * the discord client will be passed as an arg
 */
export declare function addOnReconnect(...onReconnect_: typeof onReconnects): void;
/** completely replaces existing `onReconnect` functions. prefer `addOnReconnect` */
export declare function setOnReconnect(onReconnect_: typeof onReconnects): void;
export declare function init(token: string): Discord.Client;
/** anything that can be fed into discord.js's send function. strings, embeds, etc. */
export declare type ValidMessage = MessageOptions | MessageAdditions | string | undefined | void;
/** a Command's response function is fed a single, destructurable argument */
export declare type CommandParams = {
    command: string;
    args?: string;
    msg: Discord.Message;
    content: string;
};
/** a Trigger's response function is fed a single, destructurable argument */
export declare type TriggerParams = {
    msg: Discord.Message;
    content: string;
};
/** ValidMessage, or a ValidMessage-generating function, to respond to a message with. accepts args if the command parsing generated any */
export declare type CommandResponse = ((params: CommandParams) => ValidMessage | Promise<ValidMessage>) | ValidMessage;
export declare type TriggerResponse = ((params: TriggerParams) => ValidMessage | Promise<ValidMessage>) | ValidMessage;
/** a Route needs either a Fnc, or a Response */
declare const commands: {
    command: string | string[];
    response: CommandResponse;
}[];
export declare function addCommand(...commands_: typeof commands): void;
declare const triggers: {
    trigger: RegExp;
    response: TriggerResponse;
}[];
export declare function addTrigger(...triggers_: typeof triggers): void;
