import { sendableToInteractionReplyOptions } from "../utils/misc.js";
import { arrayify } from "one-stone/array";
import { client, clientStatus } from "./index.js";
import { forceFeedback, replyOrEdit } from "../utils/raw-utils.js";
const slashCommands = {};
const theseStillNeedRegistering = [];
// anything globally registered shouldn't be registered at a server level
// or else it will show up twice in the client command list
const globalCommands = new Set();
export async function registerCommandsOnConnect() {
    while (theseStillNeedRegistering.length) {
        const nameToRegister = theseStillNeedRegistering.pop();
        if (nameToRegister) {
            const toRegister = slashCommands[nameToRegister];
            if (toRegister)
                await registerSlashCommands(toRegister.where, toRegister.config);
        }
    }
    cleanupGlobalDupes();
}
async function cleanupGlobalDupes() {
    for (const guild of client.guilds.cache.values()) {
        const commands = await guild.commands.fetch();
        for (const [, c] of commands) {
            if (globalCommands.has(c.name)) {
                console.log(`cleaning up ${c.name} in ${g(guild)}`);
                await c.delete();
            }
        }
    }
}
export function addSlashCommand({ where, config, handler, ephemeral, deferImmediately, failIfLong, autocompleters, }) {
    if (where === "global")
        globalCommands.add(config.name);
    const standardConfig = unConst(config);
    slashCommands[config.name] = {
        where,
        config: standardConfig,
        handler,
        ephemeral,
        deferImmediately,
        failIfLong,
        autocompleters,
    };
    if (clientStatus.hasConnected)
        registerSlashCommands(where, standardConfig);
    else
        theseStillNeedRegistering.push(config.name);
}
export async function routeAutocomplete(interaction) {
    var _a, _b;
    const slashCommand = slashCommands[interaction.commandName];
    if (!slashCommand) {
        const info = JSON.stringify(interaction.options.getFocused(true), null, 2);
        console.log(`unrecognized autocomplete request: ${interaction.commandName}\n${info}`);
        return [];
    }
    const { name, value } = interaction.options.getFocused(true);
    const handler = (_a = slashCommand.autocompleters) === null || _a === void 0 ? void 0 : _a[name];
    const { guild, channel, user } = interaction;
    const options = (_b = handler === null || handler === void 0 ? void 0 : handler({ guild, channel, user, stub: value })) !== null && _b !== void 0 ? _b : [];
    interaction.respond(options.slice(0, 25).map((o) => (typeof o === "string" ? { name: o, value: o } : o)));
}
export async function routeContextMenuCommand(interaction) {
    console.log("stub unsupported.. :(");
}
export async function routeSlashCommand(interaction) {
    const slashCommand = slashCommands[interaction.commandName];
    if (!slashCommand) {
        console.log(`unrecognized slash command received: ${interaction.commandName}`);
        if (!interaction.replied)
            replyOrEdit(interaction, {
                content: `sorry, not sure how to handle the command \`${interaction.commandName}\``,
                ephemeral: true,
            });
        return;
    }
    let { handler, ephemeral, deferImmediately, failIfLong } = slashCommand;
    let deferalCountdown;
    if (!failIfLong) {
        deferalCountdown = setTimeout(() => interaction.deferred || interaction.deferReply({ ephemeral }), deferImmediately ? 0 : 2600);
    }
    try {
        let results;
        if (typeof handler === "function") {
            const { guild, channel, user } = interaction;
            const { optionDict, subCommand, subCommandGroup } = createDictFromSelectedOptions([
                ...interaction.options.data,
            ]);
            const optionList = Object.entries(optionDict);
            results =
                (await handler({
                    channel,
                    guild,
                    user,
                    optionList,
                    optionDict,
                    subCommand,
                    subCommandGroup,
                })) || "";
        }
        else {
            results = handler;
        }
        deferalCountdown && clearTimeout(deferalCountdown);
        if (results) {
            if (interaction.replied)
                console.log(`${interaction.commandName}: this interaction was already replied to??`);
            else
                await replyOrEdit(interaction, {
                    ephemeral,
                    ...sendableToInteractionReplyOptions(results),
                });
        }
    }
    catch (e) {
        deferalCountdown && clearTimeout(deferalCountdown);
        console.log(e);
        await forceFeedback(interaction, { content: `⚠.. ${e}`, ephemeral: true });
    }
    deferalCountdown && clearTimeout(deferalCountdown);
    if (!interaction.replied)
        await replyOrEdit(interaction, { content: "☑", ephemeral: true });
}
async function registerSlashCommands(where, config) {
    const configs = arrayify(config);
    const serverList = new Set(client.guilds.cache.keys());
    const filteredWheres = new Set();
    if (where === "global")
        filteredWheres.add("global");
    else if (where === "all")
        for (const s of serverList)
            filteredWheres.add(s);
    else
        for (const loc of arrayify(where)) {
            if (typeof loc === "string" && serverList.has(loc))
                filteredWheres.add(loc);
        }
    for (const loc of filteredWheres) {
        const destination = loc === "global" ? client.application : client.guilds.resolve(loc);
        if (!destination)
            throw `couldn't resolve ${loc} to a guild`;
        if (!destination.commands.cache.size)
            await destination.commands.fetch();
        const cache = [...destination.commands.cache.values()];
        for (const conf of configs) {
            process.stdout.write(`${g(destination)}: registering ${conf.name}: `);
            const matchingConfig = cache.find((c) => {
                return c.equals(conf);
            });
            if (matchingConfig)
                console.log("already set up");
            else
                try {
                    await destination.commands.create(conf);
                    console.log("done");
                }
                catch (e) {
                    console.log("failed..");
                    console.log(e);
                }
        }
    }
}
function createDictFromSelectedOptions(originalOptions, meta = {
    subCommandGroup: undefined,
    subCommand: undefined,
}) {
    var _a;
    const optionDict = {};
    for (const opt of originalOptions) {
        if (opt.type === "SUB_COMMAND" || opt.type === "SUB_COMMAND_GROUP") {
            if (opt.type === "SUB_COMMAND")
                meta.subCommand = opt.name;
            if (opt.type === "SUB_COMMAND_GROUP")
                meta.subCommandGroup = opt.name;
            optionDict[opt.name] = createDictFromSelectedOptions(opt.options ? [...opt.options.values()] : [], meta).optionDict;
        }
        else {
            optionDict[opt.name] =
                opt.type === "CHANNEL"
                    ? opt.channel
                    : opt.type === "USER"
                        ? (_a = opt.member) !== null && _a !== void 0 ? _a : opt.user
                        : opt.type === "ROLE"
                            ? opt.role
                            : opt.type === "MENTIONABLE"
                                ? undefined
                                : opt.value;
        }
    }
    return { ...meta, optionDict };
}
/** allow only these users to use this command, in this guild */
export async function setPermittedCommandUserInGuild(commandName, guildId, userIds, strict = false) {
    const guild = client.guilds.resolve(guildId);
    if (!guild) {
        const err = `can't resolve ${guildId} to a guild`;
        if (strict)
            throw err;
        else
            return console.log(err);
    }
    const command = await getCommandByName(guild.commands, commandName);
    if (!command) {
        const err = `can't find command ${command} in guild ${guild.name} (${guildId})`;
        if (strict)
            throw err;
        else
            return console.log(err);
    }
    userIds = arrayify(userIds);
    const users = await guild.members.fetch({ user: userIds });
    if (users.size !== userIds.length) {
        const foundUsers = new Set(users.keys());
        const missingUsers = userIds.filter((u) => foundUsers.has(u));
        const err = `guild ${guild.name} (${guildId}) doesn't contain ${missingUsers}`;
        if (strict)
            throw err;
        else
            return console.log(err);
    }
    const permissions = users.map((u) => ({ id: u.id, type: "USER", permission: true }));
    command.permissions.set({ permissions });
}
/** allow only these users to use this command, in all guilds where it's present */
export async function setPermittedCommandUserEverywhere(commandName, userIds) {
    for (const guild of client.guilds.cache.values()) {
        const command = await getCommandByName(guild.commands, commandName);
        if (!command)
            continue;
        userIds = arrayify(userIds);
        const users = await guild.members.fetch({ user: userIds });
        if (!users.size)
            continue;
        const permissions = users.map((u) => ({ id: u.id, type: "USER", permission: true }));
        command.permissions.set({ permissions });
    }
}
async function getCommandByName(commandManager, commandName) {
    const commands = await commandManager.fetch();
    for (const [, c] of commands) {
        if (c.name === commandName) {
            return c;
        }
    }
}
function g(destination) {
    var _a;
    return `${((_a = destination.name) !== null && _a !== void 0 ? _a : "global").substring(0, 20).padEnd(20)} (${destination.id})`;
}
// type ApplicationCommandDataNoEnums = Pick<
// 	ChatInputApplicationCommandData,
// 	"defaultPermission" | "description" | "name" | "type"
// > & { options?: ApplicationCommandOption[] };
// function configDoesMatch( 	conf1: ApplicationCommandDataNoEnums, 	conf2: ApplicationCommandDataNoEnums ) { 	return ( 		conf1.name === conf2.name && 		conf1.description === conf2.description && 		(conf1.defaultPermission ?? true === conf2.defaultPermission ?? true) && 		allOptionsDoMatch(conf1.options, conf2.options) 	); }
// function allOptionsDoMatch( 	options1?: ApplicationCommandOption[], 	options2?: ApplicationCommandOption[] ) { 	return Boolean( 		options1 === options2 || 			(options1 && 				options2 && 				options1.length === options2.length && 				[...options1.keys()].every((k) => optionDoesMatch(options1[k], options2[k]))) 	); }
// function optionDoesMatch( 	option1: ApplicationCommandOption, 	option2: ApplicationCommandOption ): boolean { 	return ( 		option1.name === option2.name && 		option1.description === option2.description && 		Boolean(option1.required) === Boolean(option2.required) && 		option1.type === option2.type && 		(option1.options === option2.options || 			(!option1.options?.length && !option2.options?.length) || 			allOptionsDoMatch(option1.options ?? [], option2.options ?? [])) 	); }
// function standardizeConfig({ 	name, 	type = "CHAT_INPUT", 	description, 	defaultPermission = true, 	options = [], }: StrictCommand | ChatInputApplicationCommandData): ApplicationCommandDataNoEnums { 	return { name, type, description, defaultPermission, options: options.map(standardizeOption) }; }
//  function standardizeConfig(config: StrictCommand | ChatInputApplicationCommandData): ChatInputApplicationCommandData {
//  	return { ...config,options:config.options?[...config.options]:undefined};
//  }
// const enumToString = [
// 	null,
// 	"SUB_COMMAND",
// 	"SUB_COMMAND_GROUP",
// 	"STRING",
// 	"INTEGER",
// 	"BOOLEAN",
// 	"USER",
// 	"CHANNEL",
// 	"ROLE",
// 	"MENTIONABLE",
// 	"NUMBER",
// ] as const;
// function standardizeOption<D extends StrictOption | APIApplicationCommandOption>({
// 	type,
// 	name,
// 	description,
// 	required,
// 	choices, //
// 	options,
// }: D): ApplicationCommandOption {
// 	type = typeof type === "string" ? type : (enumToString[type] as ApplicationCommandOption["type"]);
// 	return {
// 		type,
// 		name,
// 		description,
// 		required,
// 		choices: choices as ApplicationCommandOptionChoice[],
// 		options: options?.map(standardizeOption),
// 	};
// }
// function unfreezeObject<O extends Object>(o:Readonly<O>):O{}
// function unConst(c: StrictOption): ApplicationCommandOptionData;
// function unConst(c: StrictCommand): ChatInputApplicationCommandData;
// function unConst(
// 	c: StrictCommand | StrictOption
// ): ApplicationCommandOptionData | ChatInputApplicationCommandData {
// 	const { options, ...rest } = c;
// 	return {
// 		...rest,
// 		options: options && ([...(options as any[]).map(unConst)] as any),
// 	} as any;
// }
function unConst(c) {
    return c;
}
