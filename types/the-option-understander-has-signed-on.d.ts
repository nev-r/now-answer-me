import type { ApplicationCommandOptionType, GuildChannel, GuildMember, Role, User } from "discord.js";
import { CleanUpObjectIntersectionRecursive, IntersectionFromUnion, KeyObjectUnionBy, UnionFromArray } from "./utility-types.js";
export declare type StrictCommand = Command<StrictOption>;
declare type Command<O> = Readonly<{
    name: string;
    type?: "CHAT_INPUT";
    description: string;
    options?: readonly O[];
    defaultPermission?: boolean;
}>;
declare type Choice<T extends string | number> = readonly Readonly<{
    name: string;
    value: T;
}>[];
export declare type StrictOption = Readonly<{
    name: string;
    description: string;
    required?: boolean;
    autocomplete?: boolean;
} & ({
    type: "SUB_COMMAND" | ApplicationCommandOptionType.Subcommand | "SUB_COMMAND_GROUP" | ApplicationCommandOptionType.SubcommandGroup;
    options?: readonly StrictOption[];
    choices?: undefined;
} | {
    type: "STRING" | ApplicationCommandOptionType.String;
    options?: undefined;
    choices?: Choice<string>;
} | {
    type: "INTEGER" | ApplicationCommandOptionType.Integer;
    options?: undefined;
    choices?: Choice<number>;
} | {
    type: "BOOLEAN" | ApplicationCommandOptionType.Boolean | "USER" | ApplicationCommandOptionType.User | "ROLE" | ApplicationCommandOptionType.Role | "CHANNEL" | ApplicationCommandOptionType.Channel | ApplicationCommandOptionType.Mentionable;
    options?: undefined;
    choices?: undefined;
})>;
declare type SubOptions<O> = O extends readonly any[] ? IntersectionFromUnion<OptionAsDict<O[number]>> : {};
declare type TypeByIdentifier<Identifier, Option, Choices> = Identifier extends "SUB_COMMAND" ? SubOptions<Option> : Identifier extends "SUB_COMMAND_GROUP" ? SubOptions<Option> : Identifier extends "STRING" ? Choices extends readonly {
    value: string;
}[] ? Choices[number]["value"] : string : Identifier extends "INTEGER" ? Choices extends readonly {
    value: number;
}[] ? Choices[number]["value"] : number : Identifier extends "BOOLEAN" ? boolean : Identifier extends "USER" ? User | GuildMember : Identifier extends "CHANNEL" ? GuildChannel : Identifier extends "ROLE" ? Role : never;
declare type OptionAsDict<Option> = Option extends {
    name: infer Name;
    type: infer Identifier;
    required?: infer Required;
    autocomplete?: infer Autocomplete;
    options?: infer Option;
    choices?: infer Choices;
} ? Name extends string ? Required extends true ? {
    [k in Name]: TypeByIdentifier<Identifier, Option, Choices>;
} : Identifier extends "SUB_COMMAND" | "SUB_COMMAND_GROUP" | "BOOLEAN" ? {
    [k in Name]: TypeByIdentifier<Identifier, Option, Choices>;
} : {
    [k in Name]?: TypeByIdentifier<Identifier, Option, Choices>;
} : never : never;
export declare type CommandOptionsMap<C extends StrictCommand> = C extends StrictCommand & {
    options: readonly StrictOption[];
} ? CleanUpObjectIntersectionRecursive<IntersectionFromUnion<OptionAsDict<UnionFromArray<C["options"]>>>> : unknown;
declare type TopLevelCommandWithSubcommandsOrSubcommandGroups = Readonly<{
    options: SubcommandOrSubGroupList;
}>;
declare type SubcommandOrSubGroupList = readonly {
    name: string;
    type: "SUB_COMMAND" | "SUB_COMMAND_GROUP";
    options?: any;
}[];
declare type CommandWithSubs = Readonly<{
    options: SubcommandList;
}>;
declare type SubcommandList = readonly {
    name: string;
    type: "SUB_COMMAND";
    options?: any;
}[];
export declare type SubCommandsOf<Command> = Command extends TopLevelCommandWithSubcommandsOrSubcommandGroups ? SubCommandsFromTopLevelOptions<Command["options"]> : undefined;
declare type SubCommandsFromTopLevelOptions<Options extends SubcommandOrSubGroupList> = OptionMapToSubcommandNames<OptionsMappedByName<Options>>;
declare type OptionMapToSubcommandNames<OptionsMap extends Record<string, SubcommandList[number]>> = {
    [Name in keyof OptionsMap]: OptionsMap[Name]["type"] extends "SUB_COMMAND" ? Name : OptionsMap[Name]["type"] extends "SUB_COMMAND_GROUP" ? OptionsMap[Name] extends CommandWithSubs ? SubCommandsFromTopLevelOptions<OptionsMap[Name]["options"]> : never : never;
}[keyof OptionsMap];
export declare type SubCommandGroupsOf<Command> = Command extends TopLevelCommandWithSubcommandsOrSubcommandGroups ? SubCommandGroupsFromOptions<Command["options"]> : unknown;
declare type SubCommandGroupsFromOptions<Options extends SubcommandOrSubGroupList> = OptionMapToSubcommandGroupNames<OptionsMappedByName<Options>>;
declare type OptionMapToSubcommandGroupNames<A extends Record<string, SubcommandList[number]>> = {
    [k in keyof A]: A[k]["type"] extends "SUB_COMMAND_GROUP" ? k : never;
}[keyof A];
declare type OptionsMappedByName<Options extends SubcommandOrSubGroupList> = CleanUpObjectIntersectionRecursive<IntersectionFromUnion<KeyObjectUnionBy<UnionFromArray<Options>, "name">>>;
export {};
