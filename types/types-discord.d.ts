import type { Embed, MessageOptions } from "discord.js";
/**
 * a Sendable is anything that can be fed into discord.js's send function:
 *
 * strings, MessageOptions, embeds, attachments, arrays of the aforementioned, etc.
 */
export declare type Sendable = Embed | (MessageOptions & {
    ephemeral?: boolean;
}) | string;
