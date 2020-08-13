import Discord from "discord.js";
export * from "./util.js";
export const startupTimestamp = new Date();
export const client = new Discord.Client();

let hasConnectedBefore = false;

// bot functionality stuff
export let prefix = "!";
export function setPrefix(prefix_: string) {
  prefix = prefix_;
}

export let testPrefix: string | undefined;
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
export function setCommandRegex() {
  commandRegex = new RegExp(
    (env === "production" ? prefix : testPrefix) +
      "(?<command>[\\w?]+)(?: (?<args>.+))?$"
  );
}

let activities: { name: string; options?: Discord.ActivityOptions }[] = [];
/**
 * add discord presence statuses to cycle through
 */
export function addActivities(...activities_: typeof activities) {
  activities.push(...activities_);
}
/** completely replaces existing `activities` statuses. you may want `addActivities` */
export function setActivities(activities_: typeof activities) {
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
  setCommandRegex();

  client
    .on("message", (msg: Discord.Message) => {
      // match command name and args
      const { command, args } =
        (msg.content.startsWith(prefix) &&
          msg.content.match(commandRegex)?.groups) ||
        noCommandMatch;

      // quit (↓ if no command)   or   (↓ if this is your own message)
      if (!command || msg.author === client.user) return;

      // dispatch to per-command subroutines
      routeCommand(msg, command, args);
    })
    .once("ready", () => {
      startActivityUpkeep();
      onConnect.forEach((fnc) => fnc(client));

      // set `hasConnectedBefore` after 10s, so reconnect events don't fire the first time
      setTimeout(() => {
        hasConnectedBefore = true;
      }, 10000);
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

const router: ({
  command: string | string[];
} & (
  | { fnc?: (msg: Discord.Message, args?: string) => void; response: undefined }
  | {
      response?:
        | ((args?: string, { asdf }?: { asdf: string }) => void)
        | string;
      fnc: undefined;
    }
))[] = [];
export function addRoutes(...routes: typeof router) {
  router.push(...routes);
}

function routeCommand(msg: Discord.Message, command: string, args?: string) {
  const { fnc, response } =
    router.find((r) =>
      typeof r.command === "string"
        ? r.command === command
        : r.command.includes(command)
    ) ?? {};

  (response === undefined
    ? fnc ?? (() => console.log(`command not found: ${command}`))
    : (msg: Discord.Message, args?: string) => {
        msg.channel.send(
          typeof response === "string" ? response : response(args)
        );
      })(msg, args);
}
