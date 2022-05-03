/// <reference types="node" />
import { GuildEmoji } from "discord.js";
export declare function createDynamicEmojiManager(guilds: string[], drainUntilFree?: number): {
    (emoji: {
        attachment: string | Buffer;
        name: string;
    }): Promise<GuildEmoji>;
    (emojis: {
        attachment: string | Buffer;
        name: string;
    }[]): Promise<NodeJS.Dict<GuildEmoji>>;
};
