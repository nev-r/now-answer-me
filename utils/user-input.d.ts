import { MessageEmbed, UserResolvable, Message, TextChannel, DMChannel, NewsChannel, AwaitMessagesOptions } from "discord.js";
/** wip */
export declare function promptForText({ channel, options, user, swallowResponse, awaitOptions, promptContent, }: {
    channel: TextChannel | DMChannel | NewsChannel;
    options: RegExp | string | string[];
    user?: UserResolvable | UserResolvable[];
    swallowResponse?: boolean;
    awaitOptions?: AwaitMessagesOptions;
    promptContent?: string | MessageEmbed;
}): Promise<{
    text: string;
    message: Message;
} | undefined>;
/**
 * posts 1 or more options (emoji) to a message,
 * and awaits a selection (someone clicking one)
 *
 * returns which emoji was selected, or undefined if it timed out waiting
 *
 * cleanupReactions controls whether to remove
 *
 * aborting this prevents reaction cleanup and returns undefined
 */
export declare function presentOptions<T extends string>({ msg, options, deleteAfter, cleanupReactions, waitTime, }: {
    msg: Message;
    options: T | T[];
    deleteAfter?: boolean;
    cleanupReactions?: boolean;
    waitTime?: number;
}): Promise<T | undefined>;
