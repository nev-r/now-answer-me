import type {
	ApplicationCommandOptionType,
	GuildChannel,
	GuildMember,
	Role,
	User,
} from "discord.js";
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

export type StrictOption = Readonly<
	{
		name: string;
		description: string;
		required?: boolean;
		autocomplete?: boolean;
	} & (
		| {
				type:
					| "SUB_COMMAND"
					| ApplicationCommandOptionType.Subcommand
					| "SUB_COMMAND_GROUP"
					| ApplicationCommandOptionType.SubcommandGroup;
				options?: readonly StrictOption[];
				choices?: undefined;
		  }
		| {
				type: "STRING" | ApplicationCommandOptionType.String;
				options?: undefined;
				choices?: Choice<string>;
		  }
		| {
				type: "INTEGER" | ApplicationCommandOptionType.Integer;
				options?: undefined;
				choices?: Choice<number>;
		  }
		| {
				type:
					| "BOOLEAN"
					| ApplicationCommandOptionType.Boolean
					| "USER"
					| ApplicationCommandOptionType.User
					| "ROLE"
					| ApplicationCommandOptionType.Role
					| "CHANNEL"
					| ApplicationCommandOptionType.Channel
					| ApplicationCommandOptionType.Mentionable;
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
	autocomplete?: infer Autocomplete;
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

type TopLevelCommandWithSubcommandsOrSubcommandGroups = Readonly<{
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

export type SubCommandsOf<Command> =
	Command extends TopLevelCommandWithSubcommandsOrSubcommandGroups
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

export type SubCommandGroupsOf<Command> =
	Command extends TopLevelCommandWithSubcommandsOrSubcommandGroups
		? SubCommandGroupsFromOptions<Command["options"]>
		: unknown;

type SubCommandGroupsFromOptions<Options extends SubcommandOrSubGroupList> =
	OptionMapToSubcommandGroupNames<OptionsMappedByName<Options>>;

type OptionMapToSubcommandGroupNames<A extends Record<string, SubcommandList[number]>> = {
	[k in keyof A]: A[k]["type"] extends "SUB_COMMAND_GROUP" ? k : never;
}[keyof A];

type OptionsMappedByName<Options extends SubcommandOrSubGroupList> =
	CleanUpObjectIntersectionRecursive<
		IntersectionFromUnion<KeyObjectUnionBy<UnionFromArray<Options>, "name">>
	>;

const x = {
	name: "test",
	description: "pbbbbbbt",
	options: [
		{ name: "mysubA", description: "fkjwrngktrg", type: "SUB_COMMAND" },
		{ name: "mysub0", description: "ewjrhbgwjhrg", type: "SUB_COMMAND" },
		{
			name: "my-sub-command-group-1",
			description: "fkjerngwikrtjnh",
			type: "SUB_COMMAND_GROUP",
			options: [
				{ name: "mysub1", description: "34624563456", type: "SUB_COMMAND" },
				{ name: "mysub2", description: "ije4nhfw45gjh", type: "SUB_COMMAND" },
			],
		},
		{
			name: "my-sub-command-group-2",
			description: "fkjerngwikrtjnh",
			type: "SUB_COMMAND_GROUP",
			options: [
				{ name: "mysub1", description: "34624563456", type: "SUB_COMMAND" },
				{ name: "mysub3", description: "ije4nhfw45gjh", type: "SUB_COMMAND" },
			],
		},
	],
} as const;

type IDK = SubCommandGroupsOf<typeof x>;
type IDK1 = SubCommandsOf<typeof x>;
type IDK2 = CommandOptionsMap<typeof x>;
