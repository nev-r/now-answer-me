import Discord from "discord.js";
export * from "./util.js";
export const startupTimestamp = new Date();
export const client = new Discord.Client();

let hasConnectedBefore = false;

let _clientReadyResolve: (value?: unknown) => void;
export const clientReadyPromise = new Promise((resolve) => {
  _clientReadyResolve = resolve;
});
export let clientReady = false;

// bot functionality stuff
export let prefix = "!";
export function setPrefix(prefix_: string) {
  prefix = prefix_;
}

export let testPrefix = "!";
export function setTestPrefix(testPrefix_: string) {
  testPrefix = testPrefix_;
}

export let env: "test" | "production" = "production";
/**
 * `'test'|false` for test env,
 * `'production'|true` for production
 */
export function setEnv(env_: typeof env | boolean) {
  env = env_ === true ? "production" : env_ === false ? "test" : env_;
}

let commandRegex: RegExp;
export function setupCommandRegex() {
  commandRegex = new RegExp(
    "^" +
      escapeRegExp(env === "production" ? prefix : testPrefix) +
      "(?<command>[\\w?]+)(?: (?<args>.+))?$"
  );
}

let activities: { name: string; options?: Discord.ActivityOptions }[] = [];
/**
 * add discord presence statuses to cycle through
 */
export function addActivity(...activities_: typeof activities) {
  activities.push(...activities_);
}
/** completely replaces existing `activities` statuses. you may want `addActivity` */
export function setActivity(activities_: typeof activities) {
  activities = activities_;
}

let onConnect: ((client_: Discord.Client) => void)[] = [];
/**
 * add function(s) to run upon first logging into discord
 *
 * the discord client will be passed as an arg
 */
export function addOnConnect(...onConnect_: typeof onConnect) {
  onConnect.push(...onConnect_);
}
/** completely replaces existing `onConnect` functions. prefer `addOnConnect` */
export function setOnConnect(onConnect_: typeof onConnect) {
  onConnect = onConnect_;
}

let onReconnect: ((client_: Discord.Client) => void)[] = [];
/**
 * add function(s) to run upon any reconnection to discord
 *
 * the discord client will be passed as an arg
 */
export function addOnReconnect(...onReconnect_: typeof onReconnect) {
  onReconnect.push(...onReconnect_);
}
/** completely replaces existing `onReconnect` functions. prefer `addOnReconnect` */
export function setOnReconnect(onReconnect_: typeof onReconnect) {
  onReconnect = onReconnect_;
}

const noCommandMatch = { command: undefined, args: undefined };

export function init(token: string) {
  setupCommandRegex();

  client
    .on("message", (msg: Discord.Message) => {
      // quit if this is your own message
      if (msg.author === client.user) return;

      // match command name and args
      const { command, args } =
        (msg.content.startsWith(prefix) &&
          msg.content.match(commandRegex)?.groups) ||
        noCommandMatch;

      if (command) routeCommand(msg, command, args);
      else routeTrigger(msg);
    })
    .once("ready", () => {
      startActivityUpkeep();
      onConnect.forEach((fnc) => fnc(client));

      // set `hasConnectedBefore` after 5s, so reconnect events don't fire the first time
      setTimeout(() => {
        hasConnectedBefore = true;
      }, 5000);
      _clientReadyResolve(true);
      clientReady = true;
    })
    .on("ready", () => {
      hasConnectedBefore && onReconnect.forEach((fnc) => fnc(client));
    })
    .login(token);
  return client;
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
/** anything that can be fed into discord.js's send function. strings, embeds, etc. */
type ValidMessage = Parameters<Discord.TextChannel["send"]>[number];
/** does something given a discord message and maybe, anything found after the command */
type Fnc = (msg: Discord.Message, args?: string) => void | Promise<void>;
/** ValidMessage, or a ValidMessage-generating function, to respond to a message with. accepts args if the command parsing generated any */
type Response =
  | ((args?: string) => string | Promise<ValidMessage>)
  | ValidMessage;
/** a Route needs either a Fnc, or a Response */
type Route =
  | {
      fnc: Fnc;
      response?: undefined;
    }
  | {
      response: Response;
      fnc?: undefined;
    };

const commands: ({
  command: string | string[];
} & Route)[] = [];
export function addCommand(...commands_: typeof commands) {
  commands.push(...commands_);
}

const triggers: ({
  trigger: RegExp;
} & Route)[] = [];
export function addTrigger(...triggers_: typeof triggers) {
  triggers.push(...triggers_);
}

async function routeCommand(
  msg: Discord.Message,
  command: string,
  args?: string
) {
  let { fnc, response } =
    commands.find((r) =>
      typeof r.command === "string"
        ? r.command === command
        : r.command.includes(command)
    ) ?? {};

  if (fnc) fnc(msg, args);
  else if (response) {
    if (typeof response === "function")
      response = await response(msg, msg.content);
    try {
      msg.channel.send(response);
    } catch (e) {
      console.log(e);
    }
  }
}

async function routeTrigger(msg: Discord.Message) {
  let { fnc, response } =
    triggers.find((t) => t.trigger.test(msg.content)) ?? {};

  if (fnc) fnc(msg, msg.content);
  else if (response) {
    if (typeof response === "function")
      response = await response(msg, msg.content);
    try {
      msg.channel.send(response);
    } catch (e) {
      console.log(e);
    }
  }
}

// via MDN
function escapeRegExp(string: string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
