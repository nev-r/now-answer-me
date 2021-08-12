import type { GuildChannel, GuildMember, Role, User } from "discord.js";
import { ApplicationCommandOptionTypes, ApplicationCommandTypes } from "discord.js/typings/enums";
import {
	CleanUpObjectIntersectionRecursive,
	IntersectionFromUnion,
	KeyObjectUnionBy,
	UnionFromArray,
} from "./utility-types.js";

export type StrictCommand = Command<StrictOption>;

type Command<O> = Readonly<{
	name: string;
	type?: "CHAT_INPUT";
	description: string;
	options?: readonly O[];
	defaultPermission?: boolean;
}>;

type Choice<T extends string | number> = readonly Readonly<{
	name: string;
	value: T;
}>[];

type StrictOption = Readonly<
	{
		name: string;
		description: string;
		required?: boolean;
	} & (
		| {
				type:
					| "SUB_COMMAND"
					| ApplicationCommandOptionTypes.SUB_COMMAND
					| "SUB_COMMAND_GROUP"
					| ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;
				options?: readonly StrictOption[];
				choices?: undefined;
		  }
		| {
				type: "STRING" | ApplicationCommandOptionTypes.STRING;
				options?: undefined;
				choices?: Choice<string>;
		  }
		| {
				type: "INTEGER" | ApplicationCommandOptionTypes.INTEGER;
				options?: undefined;
				choices?: Choice<number>;
		  }
		| {
				type:
					| "BOOLEAN"
					| ApplicationCommandOptionTypes.BOOLEAN
					| "USER"
					| ApplicationCommandOptionTypes.USER
					| "ROLE"
					| ApplicationCommandOptionTypes.ROLE
					| "CHANNEL"
					| ApplicationCommandOptionTypes.CHANNEL
					| ApplicationCommandOptionTypes.MENTIONABLE;
				options?: undefined;
				choices?: undefined;
		  }
	)
>;

type SubOptions<O> = O extends readonly any[] ? IntersectionFromUnion<OptionAsDict<O[number]>> : {};

type TypeByIdentifier<Identifier, Option, Choices> = Identifier extends "SUB_COMMAND"
	? SubOptions<Option>
	: Identifier extends "SUB_COMMAND_GROUP"
	? SubOptions<Option>
	: Identifier extends "STRING"
	? Choices extends readonly { value: string }[]
		? Choices[number]["value"]
		: string
	: Identifier extends "INTEGER"
	? Choices extends readonly { value: number }[]
		? Choices[number]["value"]
		: number
	: Identifier extends "BOOLEAN"
	? boolean
	: Identifier extends "USER"
	? User | GuildMember
	: Identifier extends "CHANNEL"
	? GuildChannel
	: Identifier extends "ROLE"
	? Role
	: never;

type OptionAsDict<Option> = Option extends {
	name: infer Name;
	type: infer Identifier;
	required?: infer Required;
	options?: infer Option;
	choices?: infer Choices;
}
	? Name extends string
		? Required extends true
			? { [k in Name]: TypeByIdentifier<Identifier, Option, Choices> }
			: Identifier extends "SUB_COMMAND" | "SUB_COMMAND_GROUP" | "BOOLEAN"
			? { [k in Name]: TypeByIdentifier<Identifier, Option, Choices> }
			: { [k in Name]?: TypeByIdentifier<Identifier, Option, Choices> }
		: never
	: never;

export type CommandOptionsMap<C extends StrictCommand> = C extends StrictCommand & {
	options: readonly StrictOption[];
}
	? CleanUpObjectIntersectionRecursive<
			IntersectionFromUnion<OptionAsDict<UnionFromArray<C["options"]>>>
	  >
	: unknown;

type CommandWithSubsOrGroups = Readonly<{
	options: SubcommandOrSubGroupList;
}>;

type SubcommandOrSubGroupList = readonly {
	name: string;
	type: "SUB_COMMAND" | "SUB_COMMAND_GROUP";
	options?: any;
}[];

type CommandWithSubs = Readonly<{
	options: SubcommandList;
}>;
type SubcommandList = readonly {
	name: string;
	type: "SUB_COMMAND";
	options?: any;
}[];

export type SubCommandsOf<Command> = Command extends CommandWithSubsOrGroups
	? SubCommandsFromTopLevelOptions<Command["options"]>
	: undefined;

type SubCommandsFromTopLevelOptions<Options extends SubcommandOrSubGroupList> =
	OptionMapToSubcommandNames<OptionsMappedByName<Options>>;

type OptionMapToSubcommandNames<OptionsMap extends Record<string, SubcommandList[number]>> = {
	// for every option whose type is SUB_COMMAND,
	[Name in keyof OptionsMap]: OptionsMap[Name]["type"] extends "SUB_COMMAND"
		? // return its name
		  Name
		: // and if it's a SUB_COMMAND_GROUP,
		OptionsMap[Name]["type"] extends "SUB_COMMAND_GROUP"
		? // and can itself be parsed
		  OptionsMap[Name] extends CommandWithSubs
			? // recurse to find those subcommand names
			  SubCommandsFromTopLevelOptions<OptionsMap[Name]["options"]>
			: never
		: never;
}[keyof OptionsMap];

type SubCommandsFromSecondLevelOptions<Options extends SubcommandList> =
	SecondLevelOptionMapToSubcommandNames<OptionsMappedByName<Options>>;
type SecondLevelOptionMapToSubcommandNames<
	OptionsMap extends Record<string, SubcommandList[number]>
> = {
	// for every option whose type is SUB_COMMAND,
	[Name in keyof OptionsMap]: OptionsMap[Name]["type"] extends "SUB_COMMAND"
		? // return its name
		  Name
		: never;
};
/////////////////////////////////////

export type SubCommandGroupsOf<Command> = Command extends CommandWithSubs
	? SubCommandGroupsFromOptions<Command["options"]>
	: undefined;

type SubCommandGroupsFromOptions<Options extends SubcommandList> = OptionMapToSubcommandGroupNames<
	OptionsMappedByName<Options>
>;

type OptionMapToSubcommandGroupNames<A extends Record<string, SubcommandList[number]>> = {
	[k in keyof A]: A[k]["type"] extends "SUB_COMMAND_GROUP" ? k : never;
}[keyof A];

type OptionsMappedByName<Options extends SubcommandOrSubGroupList> =
	CleanUpObjectIntersectionRecursive<
		IntersectionFromUnion<KeyObjectUnionBy<UnionFromArray<Options>, "name">>
	>;
