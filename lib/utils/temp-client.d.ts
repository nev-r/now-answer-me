import { Client } from "discord.js";
export declare function doSomethingUsingTempClient<T>(apiToken: string, something: (client: Client) => Promise<T> | T): Promise<T>;
