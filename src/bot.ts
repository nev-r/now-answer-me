import Discord, { MessageAdditions, MessageOptions } from "discord.js";
export const startupTimestamp = new Date();
export const client = new Discord.Client();

let _clientReadyResolve: (
  value: Discord.Client | PromiseLike<Discord.Client>
) => void;

/** resolves when the client has connected */
export let clientReadyPromise: Promise<Discord.Client> = new Promise(
  (resolve) => {
    _clientReadyResolve = resolve;
  }
);

/** check if the client has done its first connection */
export let clientReady = false;

//
// bot functionality stuff
//

// let prefixString: string|undefined;
// let prefixRegex: RegExp|undefined;
let prefixCheck: (s: string) => ReturnType<string["match"]>;
// let commandRegex: RegExp;

/**
 * set the command prefix (i.e. "!"" or "?"" or whatever)
 *
 * @param prefix a string will be used literally. a regex can be used instead,
 * but it needs to be carefully formatted, including (likely) a `^`, and needs
 * named `(<command>` and `(<args>` subpatterns
 *
 * ideally, use a string prefix because it's going to be a lot faster to check
 * startsWith, instead of executing a regex on every message that goes by
 */
export function setPrefix(prefix: string | RegExp) {
  if (typeof prefix === "string") {
    const newRegex = new RegExp(
      `^(${escapeRegExp(prefix).replace(
        /^\^+/,
        ""
      )})(?<command>\\S*)(?: (?<args>.+))?$`
    );
    prefixCheck = (s) => (s.startsWith(prefix) ? s.match(newRegex) : null);
  } else {
    prefixCheck = (s) => s.match(prefix);
  }
}
setPrefix("!");

// list of statuses for the bot to cycle through
let activities: Discord.ActivityOptions[] = [];

/**
 * add 1 or more discord presence statuses to cycle through
 */
export function addActivity(
  ...activities_: (string | Discord.ActivityOptions)[]
) {
  activities.push(
    ...activities_.map((a) => (typeof a === "string" ? { name: a } : a))
  );
}

/**
 * completely replaces existing `activities` statuses. you may want `addActivity` instead
 */
export function setActivities(activities_: typeof activities) {
  activities = activities_;
}

// list of functions to run on initial connection
let onConnects: ((client_: Discord.Client) => void)[] = [];

/**
 * add function(s) to run upon first logging into discord
 *
 * the discord client will be passed as an arg
 */
export function addOnConnect(...onConnect_: typeof onConnects) {
  onConnects.push(...onConnect_);
}

/** completely replaces existing `onConnect` functions. prefer `addOnConnect` */
export function setOnConnect(onConnects_: typeof onConnects) {
  onConnects = onConnects_;
}

// list of functions to run on reconnection
let onReconnects: ((client_: Discord.Client) => void)[] = [];

/**
 * add function(s) to run upon any reconnection to discord
 *
 * the discord client will be passed as an arg
 */
export function addOnReconnect(...onReconnect_: typeof onReconnects) {
  onReconnects.push(...onReconnect_);
}

/** completely replaces existing `onReconnect` functions. prefer `addOnReconnect` */
export function setOnReconnect(onReconnect_: typeof onReconnects) {
  onReconnects = onReconnect_;
}

// messy
type commandMatch = { command: string | undefined; args: string | undefined };

/** starts the client up. resolves (to the client) when the client has connected/is ready */
export function init(token: string) {
  client
    .on("message", async (msg: Discord.Message) => {
      // quit if this is the bot's own message
      if (msg.author === client.user) return;
      // match command
      const isCommand = prefixCheck(msg.content);
      if (isCommand) {
        const routed = await routeCommand(
          msg,
          isCommand.groups!.command,
          isCommand.groups!.args
        );
        if (routed) return;
        // done if routed successfully.
      }
      // otherwise, check for a trigger
      routeTrigger(msg);
    })
    .once("ready", () => {
      startActivityUpkeep();
      onConnects.forEach((fnc) => fnc(client));

      // set `hasConnectedBefore` in 5s, so reconnect events don't fire the first time
      setTimeout(() => {
        clientReady = true;
      }, 1000);
      _clientReadyResolve(client);
    })
    .on("ready", () => {
      clientReady && onReconnects.forEach((fnc) => fnc(client));
    })
    .login(token);
  return clientReadyPromise;
}

let activitiesIndex = 0;

function startActivityUpkeep() {
  setInterval(() => {
    activitiesIndex++;
    if (!activities[activitiesIndex]) activitiesIndex = 0;
    activities.length &&
      activities[activitiesIndex] &&
      client.user?.setActivity(activities[activitiesIndex]);
  }, 30000);
}

/**
 * a ValidMessage is anything that can be fed into discord.js's send function:
 *
 * strings, MessageOptions, embeds, attachments, arrays of the aforementioned, etc.
 */
export type ValidMessage =
  | (MessageOptions & { split?: false | undefined })
  | MessageAdditions
  | string;

/**
 * describes the message that triggered a CommandResponse
 */
export interface CommandParams {
  /** the message that triggered this command */
  msg: Discord.Message;
  /** the text content of the message that triggered this command */
  content: string;
  /** the matched command name */
  command: string;
  /** any string content after the matched command name */
  args?: string;
}

/**
 * describes the message that triggered a TriggerResponse
 */
export interface TriggerParams {
  /** the message that triggered this command */
  msg: Discord.Message;
  /** the text content of the message that triggered this command */
  content: string;
}

/**
 * either a ValidMessage, or a function that generates a ValidMessage.
 * if it's a function, it's passed the CommandParams object
 */
export type CommandResponse =
  | ((
      params: CommandParams
    ) =>
      | ValidMessage
      | undefined
      | void
      | Promise<ValidMessage | undefined | void>)
  | ValidMessage;

/**
 * either a ValidMessage, or a function that generates a ValidMessage.
 * if it's a function, it's passed the TriggerParams object
 */
export type TriggerResponse =
  | ((
      params: TriggerParams
    ) =>
      | ValidMessage
      | undefined
      | void
      | Promise<ValidMessage | undefined | void>)
  | ValidMessage;

interface Constraints {
  user?: string | string[];
  channel?: string | string[];
  guild?: string | string[];
}

interface ConstraintCategories {
  allowOnly?: Constraints;
  block?: Constraints;
  allow?: Constraints;
}

const commands: ({
  command: string | string[];
  response: CommandResponse;
} & ConstraintCategories)[] = [];

/**
 * either a ValidMessage, or a function that generates a ValidMessage.
 * if it's a function, it's passed the TriggerParams object
 */
export function addCommand(...commands_: typeof commands) {
  commands_.forEach((c) => {
    enforceWellStructuredCommand(c.command);
    enforceWellStructuredResponse(c.response);
  });
  commands.push(...commands_);
}

const triggers: ({
  trigger: RegExp;
  response: TriggerResponse;
} & ConstraintCategories)[] = [];

/**
 * either a ValidMessage, or a function that generates a ValidMessage.
 * if it's a function, it's passed the TriggerParams object
 */
export function addTrigger(...triggers_: typeof triggers) {
  triggers_.forEach((t) => {
    enforceWellStructuredTrigger(t.trigger);
    enforceWellStructuredResponse(t.response);
  });
  triggers.push(...triggers_);
}

// given a command string, find and run the appropriate function
async function routeCommand(
  msg: Discord.Message,
  command: string,
  args?: string
) {
  let foundCommand = commands.find(
    (r) => r.command === command || r.command.includes(command)
  );

  if (foundCommand) {
    let { response } = foundCommand;
    if (!meetsConstraints(msg, foundCommand)) {
      console.log(
        `constraints suppressed a response to ${msg.author} requesting ${command}`
      );
      return;
    }
    if (typeof response === "function")
      response =
        (await response({ msg, command, args, content: msg.content })) || "";
    try {
      response && (await msg.channel.send(response));
    } catch (e) {
      console.log(e);
    }
    // let upstream know we successfully found a route
    return true;
  }
}

function meetsConstraints(
  msg: Discord.Message,
  { allowOnly, allow, block }: ConstraintCategories
) {
  const {
    author: { id: authorId },
    channel: { id: channelId },
    guild,
  } = msg;
  const guildId = guild?.id;

  // if an allow constraint exists, and it's met, allow
  if (allow) {
    const { user, channel, guild } = allow;
    if (
      (channel &&
        (typeof channel === "string"
          ? channel === channelId
          : channel.includes(channelId))) ||
      (user &&
        (typeof user === "string"
          ? user === authorId
          : user.includes(authorId))) ||
      (guild &&
        guildId &&
        (typeof guild === "string"
          ? guild === guildId
          : guild.includes(guildId)))
    )
      return true;
  }

  // if an allowOnly constraint exists, and it's not met, block
  if (allowOnly) {
    const { user, channel, guild } = allowOnly;
    if (
      (channel &&
        !(typeof channel === "string"
          ? channel === channelId
          : channel.includes(channelId))) ||
      (user &&
        !(typeof user === "string"
          ? user === authorId
          : user.includes(authorId))) ||
      (guild &&
        guildId &&
        !(typeof guild === "string"
          ? guild === guildId
          : guild.includes(guildId)))
    )
      return false;
  }

  // if a block constraint exists, and it's met, block
  if (block) {
    const { user, channel, guild } = block;
    if (
      (channel &&
        (typeof channel === "string"
          ? channel === channelId
          : channel.includes(channelId))) ||
      (user &&
        (typeof user === "string"
          ? user === authorId
          : user.includes(authorId))) ||
      (guild &&
        guildId &&
        (typeof guild === "string"
          ? guild === guildId
          : guild.includes(guildId)))
    )
      return false;
  }
  return true;
}

// given a message, see if it matches a trigger, then run the corresponding function
async function routeTrigger(msg: Discord.Message) {
  let { response } = triggers.find((t) => t.trigger.test(msg.content)) ?? {};

  if (response) {
    if (typeof response === "function")
      response = (await response({ msg, content: msg.content })) || undefined;
    try {
      response && msg.channel.send(response);
    } catch (e) {
      console.log(e);
    }
  }
}

// via MDN
function escapeRegExp(string: string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
}

function enforceWellStructuredCommand(command: any) {
  if (
    typeof command === "string" ||
    (Array.isArray(command) && command.every((s) => typeof s === "string"))
  )
    return;
  throw new Error(`bad command submitted:\n${command}`);
}

function enforceWellStructuredResponse(response: any) {
  if (typeof response !== "undefined") return;
  throw new Error(`bad response submitted:\n${response}`);
}

function enforceWellStructuredTrigger(trigger: any) {
  if (trigger instanceof RegExp) return;
  throw new Error(`bad trigger submitted:\n${trigger}`);
}
