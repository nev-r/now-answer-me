import Discord, { MessageAdditions, MessageOptions } from "discord.js";
export const startupTimestamp = new Date();
export const client = new Discord.Client();

/** undefined when the client isn't started, resolves when the client has connected */
export let clientReadyPromise: Promise<Discord.Client> | undefined = undefined;

/** check if the client has done its first connection */
export let clientReady = false;

//
// bot functionality stuff
//

// let prefixRegex: RegExp;
let commandRegex: RegExp;

/**
 * set the command prefix (i.e. `!` or `?` or whatever)
 *
 * @param prefix a string will be used literally. a regex can be used instead,
 * like `!|?` but it shouldn't capture the command word or the line beginning
 */
export function setPrefix(prefix: string | RegExp) {
  const newPrefix = (typeof prefix === "string"
    ? escapeRegExp(prefix)
    : prefix.source
  ).replace(/^\^+/, "");

  // prefixRegex = new RegExp(`^(${newPrefix})`);
  commandRegex = new RegExp(
    `^(${newPrefix})(?<command>[\\w?]+)(?: (?<args>.+))?$`
  );
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
export function setOnConnects(onConnects_: typeof onConnects) {
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
  let _clientReadyResolve: (
    value: Discord.Client | PromiseLike<Discord.Client>
  ) => void;
  clientReadyPromise = new Promise<Discord.Client>((resolve) => {
    _clientReadyResolve = resolve;
  });

  client
    .on("message", (msg: Discord.Message) => {
      // quit if this is the bot's own message
      if (msg.author === client.user) return;

      // match command name and args
      const { command, args } =
        msg.content.match(commandRegex)?.groups ?? ({} as commandMatch);

      if (command) routeCommand(msg, command, args);
      else routeTrigger(msg);
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

const commands: {
  command: string | string[];
  response: CommandResponse;
}[] = [];

/**
 * either a ValidMessage, or a function that generates a ValidMessage.
 * if it's a function, it's passed the TriggerParams object
 */
export function addCommand(...commands_: typeof commands) {
  commands.push(...commands_);
}

const triggers: {
  trigger: RegExp;
  response: TriggerResponse;
}[] = [];

/**
 * either a ValidMessage, or a function that generates a ValidMessage.
 * if it's a function, it's passed the TriggerParams object
 */
export function addTrigger(...triggers_: typeof triggers) {
  triggers.push(...triggers_);
}

// given a command string, find and run the appropriate function
async function routeCommand(
  msg: Discord.Message,
  command: string,
  args?: string
) {
  let { response } =
    commands.find((r) =>
      typeof r.command === "string"
        ? r.command === command
        : r.command.includes(command)
    ) ?? {};

  if (response) {
    if (typeof response === "function")
      response =
        (await response({ msg, command, args, content: msg.content })) ||
        undefined;
    try {
      response && msg.channel.send(response);
    } catch (e) {
      console.log(e);
    }
  }
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
