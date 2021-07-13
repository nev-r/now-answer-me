import { sendableToInteractionReplyOptions } from "../utils/misc.js";
import { arrayify } from "one-stone/array";
import { client, clientReady, clientStatus } from "./index.js";
const slashCommands = {};
export const needRegistering = [];
export async function registerCommandsOnConnect() {
    while (needRegistering.length) {
        const nameToRegister = needRegistering.pop();
        if (nameToRegister) {
            const toRegister = slashCommands[nameToRegister];
            if (toRegister) {
                await registerSlashCommands(toRegister.where, [toRegister.config]);
            }
        }
    }
}
export function addSlashCommand({ where, config, handler, ephemeral, defer, deferIfLong, }) {
    const standardConfig = standardizeConfig(config);
    if (clientStatus.hasConnected)
        registerSlashCommands(where, [standardConfig]);
    else
        needRegistering.push(config.name);
    slashCommands[config.name] = {
        where,
        config: standardConfig,
        handler,
        ephemeral,
        defer,
        deferIfLong,
    };
}
// given a command string, find and run the appropriate function
export async function routeSlashCommand(interaction) {
    const slashCommand = slashCommands[interaction.commandName];
    if (!slashCommand) {
        console.log(`unrecognized slash command received: ${interaction.commandName}`);
        return;
    }
    let { handler, ephemeral, defer, deferIfLong } = slashCommand;
    let deferalCountdown;
    if (defer || deferIfLong) {
        deferalCountdown = setTimeout(() => {
            interaction.defer({ ephemeral });
        }, defer ? 0 : 2300);
    }
    try {
        let results;
        if (typeof handler === "function") {
            const { guild, channel, user } = interaction;
            const { optionDict, subCommand, subCommandGroup } = createDictFromSelectedOptions([
                ...interaction.options.values(),
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
        if (results && !interaction.replied) {
            await interaction.reply({ ephemeral, ...sendableToInteractionReplyOptions(results) });
        }
    }
    catch (e) {
        await interaction.reply({ content: "⚠", ephemeral: true });
        console.log(e);
    }
    if (!interaction.replied)
        await interaction.reply({ content: "☑", ephemeral: true });
}
async function registerSlashCommands(where, config) {
    const configs = arrayify(config);
    await clientReady;
    const destination = where === "global" ? client.application : client.guilds.resolve(where);
    if (!destination)
        throw `couldn't resolve ${where} to a guild`;
    if (!destination.commands.cache.size)
        await destination.commands.fetch();
    const cache = [...destination.commands.cache.values()];
    for (const conf of configs.map(standardizeConfig)) {
        const matchingConfig = cache.find((c) => {
            return c.name === conf.name && configDoesMatch(c, conf);
        });
        console.log(`registering ${conf.name}: ${matchingConfig ? "already exists" : (await destination.commands.create(conf)) && "done!"}`);
        // console.log({ ...matchingConfig, guild: undefined, permissions: undefined });
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
function configDoesMatch(conf1, conf2) {
    return (conf1.name === conf2.name &&
        conf1.description === conf2.description &&
        conf1.defaultPermission === conf2.defaultPermission &&
        allOptionsDoMatch(conf1.options, conf2.options));
}
function allOptionsDoMatch(options1, options2) {
    return Boolean(options1 === options2 ||
        (options1 &&
            options2 &&
            options1.length === options2.length &&
            [...options1.keys()].every((k) => optionDoesMatch(options1[k], options2[k]))));
}
function optionDoesMatch(option1, option2) {
    var _a, _b, _c, _d;
    return (option1.name === option2.name &&
        option1.description === option2.description &&
        option1.required === option2.required &&
        option1.type === option2.type &&
        (option1.options === option2.options ||
            (!((_a = option1.options) === null || _a === void 0 ? void 0 : _a.length) && !((_b = option2.options) === null || _b === void 0 ? void 0 : _b.length)) ||
            allOptionsDoMatch((_c = option1.options) !== null && _c !== void 0 ? _c : [], (_d = option2.options) !== null && _d !== void 0 ? _d : [])));
}
function standardizeConfig({ name, description, defaultPermission = true, options = [], }) {
    return { name, description, defaultPermission, options: options.map(standardizeOption) };
}
const enumToString = [
    null,
    "SUB_COMMAND",
    "SUB_COMMAND_GROUP",
    "STRING",
    "INTEGER",
    "BOOLEAN",
    "USER",
    "CHANNEL",
    "ROLE",
    "MENTIONABLE",
];
function standardizeOption({ type, name, description, required, choices, //
options, }) {
    type = typeof type === "string" ? type : enumToString[type];
    return {
        type,
        name,
        description,
        required,
        choices: choices,
        options: options === null || options === void 0 ? void 0 : options.map(standardizeOption),
    };
}
