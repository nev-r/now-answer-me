import Discord, {
  ChannelResolvable,
  Client,
  MessageEmbed,
  MessageResolvable,
  TextChannel,
} from "discord.js";
import { client } from "./index.js";

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
  const doneSending = new Promise((resolve) => {
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
      client.destroy();
      resolve(sentMessage);
    });
  });

  tempClient.login(apiToken);
  return doneSending;
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
  const donePublishing = new Promise((resolve) => {
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
      client.destroy();
      resolve(messageToPublish);
    });
  });

  tempClient.login(apiToken);
  return donePublishing;
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
  message: MessageResolvable,
  content: string | MessageEmbed
) {
  const tempClient = new Discord.Client();
  const doneSending = new Promise((resolve) => {
    tempClient.on("ready", async () => {
      const resolvedChannel = tempClient.channels.resolve(channel);
      if (!resolvedChannel)
        throw new Error(
          `${channel} could not be resolved to a channel this account has access to`
        );
      if (!resolvedChannel.isText())
        throw new Error(`channel ${channel} is not a text channel`);
      const messageToEdit = resolvedChannel.messages.resolve(message);
      if (!messageToEdit)
        throw new Error(
          `couldn't find message ${message} in channel ${channel}`
        );
      await messageToEdit.edit(content);
      client.destroy();
      resolve(messageToEdit);
    });
  });

  tempClient.login(apiToken);
  return doneSending;
}
