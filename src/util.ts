import Discord, { Channel, ChannelResolvable } from "discord.js";
import { client, clientReadyPromise } from "./index.js";
/**
 * accepts the results of a `channel.send`, `await channel.send` or wraps a `channel.send`
 *
 * deletes message if someone reacts with wastebasket `🗑`, litter `🚮`, or cancel `🚫`
 */
export async function makeTrashable(
  msg: Discord.Message | void | Promise<Discord.Message | void>
) {
  msg = await Promise.resolve(msg);
  if (!msg) return;
  const userReactions = await msg.awaitReactions(
    (reaction) => trashEmojis.includes(reaction.emoji.name),
    { max: 1, time: 300000 }
  );
  if (userReactions.size) msg.delete();
}
const trashEmojis = ["🚮", "🗑️", "🚫"];

/**
 * accepts a channel to post to, a list of `T`s, and a function that turns a `T` into a valid `MessageEmbed`
 *
 * posts embeds serially until all have been shown, `🎲` advances to the next one
 */
export async function sendRerollableEmbed<T>(
  channel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel,
  remainingList: T[],
  renderer: (listItem: T) => Discord.MessageEmbed
) {
  let rerollableMessage: Discord.Message | undefined;
  while (remainingList.length) {
    const item = remainingList.pop()!;
    const embed = renderer(item);
    if (remainingList.length)
      embed.setFooter(`${remainingList.length} other results`);
    if (!rerollableMessage) {
      rerollableMessage = await channel.send(embed);
      makeTrashable(rerollableMessage);
    } else {
      rerollableMessage.edit(embed);
    }
    if (
      remainingList.length &&
      !(await presentOptions(rerollableMessage, "🎲", "others"))
    )
      return;
  }
}

/**
 * accepts a channel to post to, a list of `T`s, and a function that turns a `T` into a valid `MessageEmbed`
 */
export async function sendPaginatedEmbed<T>(
  channel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel,
  contentList: T[],
  renderer: (listItem: T) => Discord.MessageEmbed
) {
  let currentPage = 0;
  let paginatedMessage: Discord.Message | undefined;
  let done = false;
  const options = Object.keys(adjustDirections);
  while (true) {
    // either send, or update, the embed
    const embed = renderer(contentList[currentPage]);
    !done && embed.setFooter(`${currentPage + 1} / ${contentList.length}`);
    if (!paginatedMessage) {
      paginatedMessage = await channel.send(embed);
      makeTrashable(paginatedMessage);
    } else await paginatedMessage.edit(embed);

    // final edit completed
    if (done) return;

    // wait to see if something is clicked
    let adjustReact = await presentOptions(paginatedMessage, options, "others");

    // we're done if there was no response
    if (!adjustReact) done = true;

    // otherwise, adjust the page accordingly and loop again to update embed
    currentPage += adjustDirections[adjustReact ?? "done"] ?? 0;
    if (currentPage + 1 > contentList.length) currentPage = 0;
    if (currentPage < 0) currentPage = contentList.length - 1;
  }
}
const adjustDirections = { "⬅️": -1, "➡️": 1 };

/**
 * posts 1 or more options (emoji) to a message,
 * and awaits a selection (someone clicking one, thereby increasing the count)
 *
 * returns which emoji was selected, or undefined if it timed out waiting
 *
 * cleanupReactions controls whose reactions to clean up after a choice is made
 */
export async function presentOptions(
  msg: Discord.Message,
  options: string | string[],
  cleanupReactions: "all" | "others" = "all",
  awaitOptions: Discord.AwaitReactionsOptions = { max: 1, time: 60000 }
): Promise<string | undefined> {
  const options_ = arrayify(options);
  await serialReactions(msg, options_);
  // let reactionGroups: Discord.Collection<string, Discord.MessageReaction>;
  try {
    const reactionFilter = buildReactionFilter({
      notUsers: msg.client.user?.id,
      emoji: options_,
    });
    const reactionGroups = await msg.awaitReactions(
      reactionFilter,
      awaitOptions
    );

    // we timed out instead of getting a valid reaction
    if (!reactionGroups.size) {
      msg.reactions.removeAll();
      return undefined;
    }

    switch (cleanupReactions) {
      case "others":
        Promise.all(
          [...reactionGroups.values()].flatMap((reactionGroup) =>
            [...reactionGroup.users.cache.values()]
              .filter((user) => user.id !== msg.client.user?.id)
              .map((user) => {
                console.log(
                  `removing [${reactionGroup.emoji.identifier}][${reactionGroup.emoji.name}] from [${user.username}]`
                );
                return reactionGroup.users.remove(user);
              })
          )
        );
        break;

      default:
        msg.reactions.removeAll();
        break;
    }

    const { name, id } = reactionGroups.first()?.emoji ?? {};
    return name && options.includes(name)
      ? name
      : id && options.includes(id)
      ? id
      : undefined;

    // return awaitOptions.max===1 ? reactionGroups.first()?.emoji.name:;
  } catch (e) {
    // bothLog('awaitReactions failed, which is... weird\n');
    // bothLog(e);
    return undefined;
  }
}

/**
 * simple function to apply `reactions` to `msg` in a set order
 */
export async function serialReactions(
  msg: Discord.Message,
  reactions: string[]
) {
  // clockSince('about to dispatch all reactions');
  // console.log(`got this collection: ${reactions.map(r=>r[0]).join()}\nto apply to this message: ${msg}`);
  for (const reaction of reactions) {
    await singleReaction(msg, reaction);
  }
}
export async function singleReaction(msg: Discord.Message, reaction: string) {
  // console.log(`!!applying this selectable: ${reaction[0]} to this message: ${msg}`);
  await msg.react(reaction).catch(nodeLog(`${reaction[0]}≠>${msg}`));
  // console.log(`applied this selectable: ${reaction[0]} to this message: ${msg}`);
}

// function clockSince(message: string) {
//   process.stdout.write(`${new Date().getTime() - global['clock']}ms - ${message}`);
//   global['clock'] = new Date().getTime();
// }

function reactionFilterLogger(reaction, user) {
  // testLog(`filtering ${reaction.emoji.name} sent by ${user.id}`);
  return true;
}

// export function channelToString(channel: Discord.Channel) {
//   return (isDM(channel) && channel.toString()) || (isGuildChannel(channel) && channel);
// }

// function isGuildChannel(channel: Discord.Channel): channel is Discord.GuildChannel {
//   return channel.type === 'text';
// }
// function isDM(channel: Discord.Channel): channel is Discord.DMChannel {
//   return channel.type === 'dm';
// }

export type validSendContent = Parameters<Discord.TextChannel["send"]>[0];
export function announceToChannels(
  client: Discord.Client,
  message: validSendContent,
  channelIds: string | string[]
) {
  return arrayify(channelIds).map((channelId) => {
    const channel = client.channels.cache.get(channelId);
    return (
      (channel?.type === "dm" || channel?.type === "text") &&
      (channel as Discord.TextChannel).send(message)
    );
  });
  // export function announceToChannels<T extends string | string[]>(
  //   client: Discord.Client,
  //   message: validSendContent,
  //   channelIds: T
  // ): T extends string ? Promise<Discord.Message> : Promise<Discord.Message>[] {
  // return (typeof channelIds === "string" ? results[0] : results) as any;
}

type Switched<T extends number | string> = T extends string ? number : string;

// function ok<T extends number | string>(x: T): Switched<T> {
//   if (typeof x === "number") return x.toString();
//   else return Number(x);
// }

// function ok<T extends number | string>(x: T): Switched<T> {
//   if (typeof x === "number") return x.toString();
//   else return Number(x);
// }

// function swapType<T extends string>(x: T): number;
// function swapType<T extends number>(x: T): string;
// function swapType<T extends number | string>(x: T): number | string {
//   if (typeof x === "number") return x.toString();
//   else return Number(x);
// }

// function fn<D extends string | undefined>(
//   someParam: string,
//   defaultValue?: D
// ): string | (D extends undefined ? undefined : never) {
//   const result = "";
//   return result;
// }

function buildReactionFilter({
  users,
  notUsers,
  emoji,
  notEmoji,
}: {
  users?: string | string[];
  notUsers?: string | string[];
  emoji?: string | string[];
  notEmoji?: string | string[];
}) {
  users = users ? arrayify(users) : undefined;
  notUsers = notUsers ? arrayify(notUsers) : undefined;
  emoji = emoji ? arrayify(emoji) : undefined;
  notEmoji = notEmoji ? arrayify(notEmoji) : undefined;

  return (reaction: Discord.MessageReaction, user: Discord.User) => {
    // console.log({
    //   // reaction,
    //   // user,
    //   users,
    //   notUsers,
    //   userid: user.id,
    //   emoji,
    //   notEmoji,
    //   outcome:
    //     (!users || users.includes(user.id)) &&
    //     (!notUsers || !notUsers.includes(user.id)) &&
    //     (!emoji || emoji.includes(reaction.emoji.name)) &&
    //     (!notEmoji || !notEmoji.includes(reaction.emoji.name)),
    // });
    return (
      (!users || users.includes(user.id)) &&
      (!notUsers || !notUsers.includes(user.id)) &&
      (!emoji ||
        emoji.includes(reaction.emoji.name) ||
        emoji.includes(reaction.emoji.id ?? "")) &&
      (!notEmoji ||
        (!notEmoji.includes(reaction.emoji.name) &&
          !notEmoji.includes(reaction.emoji.id ?? "")))
    );
  };
}

/**
 * waits for client to be ready and then attempts to resolve a channel
 *
 * use this and refer to its results, to create a top level channel constant
 * that doesn't need to be re-resolved every single time, i.e.
 * ```
 * const ANNOUNCEMENTS_CHANNEL = resolveChannel<TextChannel>("123456789012345678");
 * // later, after client connects....
 * (await ANNOUNCEMENTS_CHANNEL)?.send("announcement!");
 * ```
 */
export async function resolveChannel<T extends Channel>(
  channel: ChannelResolvable
) {
  await clientReadyPromise;
  return client.channels.resolve(channel) as T | null;
}

function arrayify<T>(arr: T | T[]): T[] {
  return Array.isArray(arr) ? arr : [arr];
}

function nodeLog(any): (_e: any) => void {
  return (_e) => {
    process.stdout.write(any);
  };
}
