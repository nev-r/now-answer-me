import Discord from "discord.js";
export * from "./util.js";
export declare const startupTimestamp: Date;
export declare const client: Discord.Client;
export declare let prefix: string;
export declare function setPrefix(prefix_: string): void;
export declare let testPrefix: string | undefined;
export declare function setTestPrefix(testPrefix_: string): void;
export declare let env: "test" | "production";
/**
 * `'test'|false` for test env,
 * `'production'|true` for production
 */
export declare function setEnv(env_: typeof env | boolean): void;
export declare function setCommandRegex(): void;
declare let activities: {
    name: string;
    options?: Discord.ActivityOptions;
}[];
/**
 * add discord presence statuses to cycle through
 */
export declare function addActivities(...activities_: typeof activities): void;
/** completely replaces existing `activities` statuses. you may want `addActivities` */
export declare function setActivities(activities_: typeof activities): void;
declare let onConnect: ((client_: Discord.Client) => void)[];
/**
 * add function(s) to run upon first logging into discord
 *
 * the discord client will be passed as an arg
 */
export declare function addOnConnect(...onConnect_: typeof onConnect): void;
/** completely replaces existing `onConnect` functions. prefer `addOnConnect` */
export declare function setOnConnect(onConnect_: typeof onConnect): void;
declare let onReconnect: ((client_: Discord.Client) => void)[];
/**
 * add function(s) to run upon any reconnection to discord
 *
 * the discord client will be passed as an arg
 */
export declare function addOnReconnect(...onReconnect_: typeof onReconnect): void;
/** completely replaces existing `onReconnect` functions. prefer `addOnReconnect` */
export declare function setOnReconnect(onReconnect_: typeof onReconnect): void;
export declare function init(token: string): Discord.Client;
declare const router: ({
    command: string | string[];
} & ({
    fnc?: (msg: Discord.Message, args?: string) => void;
    response: undefined;
} | {
    response?: ((args?: string, { asdf }?: {
        asdf: string;
    }) => void) | string;
    fnc: undefined;
}))[];
export declare function addRoutes(...routes: typeof router): void;
