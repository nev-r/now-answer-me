/// <reference types="node" />
/// <reference types="node" />
export declare function createDynamicEmojiManager(guilds: string[], drainUntilFree?: number): {
    (emoji: {
        attachment: string | Buffer;
        name: string;
    }): Promise<import("discord.js").GuildEmoji>;
    (emojis: {
        attachment: string | Buffer;
        name: string;
    }[]): Promise<NodeJS.Dict<import("discord.js").GuildEmoji>>;
};
