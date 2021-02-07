import { UserResolvable, Message, TextChannel, DMChannel, NewsChannel, AwaitReactionsOptions } from "discord.js";
import { Sendable } from "../types/types-discord.js";
/** wip */
export declare function promptForText({ channel, options, user, swallowResponse, awaitOptions, promptContent, }: {
    channel: TextChannel | DMChannel | NewsChannel;
    options: RegExp | string[];
    user?: UserResolvable | UserResolvable[];
    swallowResponse?: boolean;
    awaitOptions?: AwaitReactionsOptions;
    promptContent?: Sendable;
}): Promise<{
    text: string;
    message: Message;
} | undefined>;
/**
 * posts 1 or more options (emoji) to a message,
 * and awaits a selection (someone clicking one, thereby increasing the count)
 *
 * returns which emoji was selected, or undefined if it timed out waiting
 *
 * cleanupReactions controls whose reactions to clean up after a choice is made
 *
 * aborting this prevents reaction cleanup and returns undefined
 */
export declare function presentOptions<T extends string>(msg: Message, options: T | T[], cleanupReactions?: "all" | "others", awaitOptions?: AwaitReactionsOptions, abortController?: {
    aborted: boolean;
}): Promise<T | undefined>;
