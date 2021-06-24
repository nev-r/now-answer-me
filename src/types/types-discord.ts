import type { MessageOptions } from "discord.js";

/**
 * a Sendable is anything that can be fed into discord.js's send function:
 *
 * strings, MessageOptions, embeds, attachments, arrays of the aforementioned, etc.
 */
export type Sendable = (MessageOptions & { split?: false | undefined }) | string;
