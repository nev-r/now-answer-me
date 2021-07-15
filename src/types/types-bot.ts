import {
	CommandInteraction,
	CommandInteractionOption,
	Emoji,
	InteractionReplyOptions,
	Message,
	MessageEmbed,
	Snowflake,
	User,
} from "discord.js";
import { Sendable } from "./types-discord.js";
export { Sendable } from "./types-discord.js";

/**
 * describes the message that triggered a CommandResponse
 */
export interface CommandParams extends TriggerParams {
	/** the matched command name */
	command: string;
	/** any string content after the matched command name */
	args?: string;
}

/**
 * describes the message that triggered a TriggerResponse
 */
export interface TriggerParams extends IncitingParams {
	/** the message that triggered this command */
	msg: Message;
	/** the text content of the message that triggered this command */
	content: string;
	/** the channel where this command was triggered */
	channel: Message["channel"];
}

export interface SlashCommandParams<
	SelectedOptions extends any,
	SelectedSubcommand extends any,
	selectedSubcommandGroup extends any
> extends IncitingParams {
	/** the channel, if any, where this command was triggered */
	channel: CommandInteraction["channel"];
	optionList: [keyof SelectedOptions, SelectedOptions[keyof SelectedOptions]][];
	optionDict: SelectedOptions;
	subCommand: SelectedSubcommand | undefined;
	subCommandGroup: selectedSubcommandGroup | undefined;
}

/**
 * basic discord metadata about who and where a command was triggered
 */
export interface IncitingParams {
	/** the guild where this command was triggered */
	guild: Message["guild"];
	/** the user who triggered this command */
	user: Message["author"];
}

/**
 * either a Sendable, or a function that generates a Sendable.
 * if it's a function, it's passed the CommandParams object
 */
export type CommandResponse =
	| ((
			params: CommandParams
	  ) => Sendable | undefined | void | Promise<Message | Sendable | undefined | void>)
	| Sendable;
/**
 * either a Sendable, or a function that generates a Sendable.
 * if it's a function, it's passed the SlashCommandParams object
 */
export type SlashCommandResponse<
	SelectedOptionMap extends any,
	SelectedSubcommand extends any,
	selectedSubcommandGroup extends any
	// SelectedOptionMap extends Record<string, CommandInteractionOption["value"]>
> =
	| ((
			params: SlashCommandParams<SelectedOptionMap, SelectedSubcommand, selectedSubcommandGroup>
	  ) =>
			| InteractionReplyOptions
			| MessageEmbed
			| string
			| undefined
			| void
			| Promise<InteractionReplyOptions | MessageEmbed | string | undefined | void>)
	| Sendable;

/**
 * either a Sendable, or a function that generates a Sendable.
 * if it's a function, it's passed the TriggerParams object
 */
export type TriggerResponse =
	| ((
			params: TriggerParams
	  ) => Sendable | undefined | void | Promise<Message | Sendable | undefined | void>)
	| Sendable;

export type ConstraintTypes = `${"require" | "block" | "allow"}${"User" | "Channel" | "Guild"}`;

export type Constraints = Partial<Record<ConstraintTypes, string | string[]>>;

export interface Extras {
	trashable?: "requestor" | "everyone";
	reportViaReaction?: boolean;
	selfDestructSeconds?: number;
}

export interface ConstraintSet {
	users?: null | Snowflake | User | (Snowflake | User)[];
	notUsers?: null | Snowflake | User | (Snowflake | User)[];
	emoji?: null | string | Snowflake | Emoji | (Snowflake | string | Emoji)[];
	notEmoji?: null | string | Snowflake | Emoji | (Snowflake | string | Emoji)[];
}
