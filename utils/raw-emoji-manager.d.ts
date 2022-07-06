/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import type { Client, GuildEmoji } from "discord.js";
/** the client must be connected to use this */
export declare function rawCreateDynamicEmojiManager(client: Client, guilds: string[], drainUntilFree?: number): {
    (emoji: {
        attachment: string | Buffer;
        name: string;
    }): Promise<GuildEmoji>;
    (emojis: {
        attachment: string | Buffer;
        name: string;
    }[]): Promise<NodeJS.Dict<GuildEmoji>>;
};
