import Discord, {
  ChannelResolvable,
  GuildEmoji,
  GuildResolvable,
  MessageEmbed,
  MessageResolvable,
} from "discord.js";

/**
 * logs into discord, sends a message to a specific channel, and logs out.
 * optionally crossposts/publishes it
 *
 * returns the message that was sent
 */
export async function sendSingleMessage(
  apiToken: string,
  channel: ChannelResolvable,
  content: string | MessageEmbed,
  publish?: boolean
) {
  const tempClient = new Discord.Client();
  const resolvesAfterClientDestroyed = new Promise<Discord.Message>(
    (resolve) => {
      tempClient.on("ready", async () => {
        const resolvedChannel = tempClient.channels.resolve(channel);
        if (!resolvedChannel)
          throw new Error(
            `${channel} could not be resolved to a channel this account has access to`
          );
        if (!resolvedChannel.isText())
          throw new Error(`channel ${channel} is not a text channel`);
        if (publish && resolvedChannel.type !== "news")
          throw new Error(
            `cannot publish. channel ${channel} is not a news/announcement channel`
          );
        const sentMessage = await resolvedChannel.send(content);
        if (publish) await sentMessage.crosspost();
        tempClient.destroy();
        resolve(sentMessage);
      });
    }
  );

  tempClient.login(apiToken);
  return resolvesAfterClientDestroyed;
}

/**
 * logs into discord, publishes an existing message found in a specific channel, and logs out
 *
 * returns the message that was published
 */
export async function publishSingleMessage(
  apiToken: string,
  channel: ChannelResolvable,
  message: MessageResolvable
) {
  const tempClient = new Discord.Client();
  const resolvesAfterClientDestroyed = new Promise<Discord.Message>(
    (resolve) => {
      tempClient.on("ready", async () => {
        const resolvedChannel = tempClient.channels.resolve(channel);
        if (!resolvedChannel)
          throw new Error(
            `${channel} could not be resolved to a channel this account has access to`
          );
        if (!resolvedChannel.isText())
          throw new Error(`channel ${channel} is not a text channel`);
        if (resolvedChannel.type !== "news")
          throw new Error(
            `cannot publish. channel ${channel} is not a news/announcement channel`
          );
        const messageToPublish = resolvedChannel.messages.resolve(message);
        if (!messageToPublish)
          throw new Error(
            `couldn't find message ${message} in channel ${channel}`
          );
        await messageToPublish.crosspost();
        tempClient.destroy();
        resolve(messageToPublish);
      });
    }
  );

  tempClient.login(apiToken);
  return resolvesAfterClientDestroyed;
}

/**
 * logs into discord, sends a message to a specific channel, and logs out.
 * optionally crossposts/publishes it
 *
 * returns the message that was sent
 */
export async function editSingleMessage(
  apiToken: string,
  channel: ChannelResolvable,
  messageId: string,
  content: string | MessageEmbed
) {
  const tempClient = new Discord.Client();
  const resolvesAfterClientDestroyed = new Promise<Discord.Message>(
    (resolve) => {
      tempClient.on("ready", async () => {
        const resolvedChannel = tempClient.channels.resolve(channel);
        if (!resolvedChannel)
          throw new Error(
            `${channel} could not be resolved to a channel this account has access to`
          );
        if (!resolvedChannel.isText())
          throw new Error(`channel ${channel} is not a text channel`);
        const messageToEdit = await resolvedChannel.messages.fetch(messageId);
        if (!messageToEdit)
          throw new Error(
            `couldn't find message ${messageId} in channel ${resolvedChannel}`
          );
        await messageToEdit.edit(content);
        tempClient.destroy();
        resolve(messageToEdit);
      });
    }
  );

  tempClient.login(apiToken);
  return resolvesAfterClientDestroyed;
}

/**
 * logs into discord, sends a message to a specific channel, and logs out.
 * optionally crossposts/publishes it
 *
 * returns the message that was sent
 */
export async function buildStaticEmojiDict(
  apiToken: string,
  guilds: GuildResolvable | GuildResolvable[]
) {
  guilds = Array.isArray(guilds) ? guilds : [guilds];
  const results: NodeJS.Dict<GuildEmoji> = {};
  const tempClient = new Discord.Client();
  const resolvesAfterClientDestroyed = new Promise<NodeJS.Dict<GuildEmoji>>(
    (resolve) => {
      tempClient.on("ready", async () => {
        for (const guild of guilds as Discord.GuildResolvable[]) {
          const emojis = tempClient.guilds.resolve(guild)?.emojis.cache;
          emojis?.forEach((emoji) => (results[emoji.name] = emoji));
        }
        tempClient.destroy();
        resolve(results);
      });
    }
  );

  tempClient.login(apiToken);
  return resolvesAfterClientDestroyed;
}

function undict<T>(dict: NodeJS.Dict<T>): Record<string, T> {
  return dict as any;
}
