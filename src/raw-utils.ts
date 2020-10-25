import type {
  Client,
  ChannelResolvable,
  GuildEmoji,
  GuildResolvable,
  MessageEmbed,
  MessageResolvable,
  BufferResolvable,
  UserResolvable,
} from "discord.js";
import { sleep } from "one-stone/promise";

export async function buildEmojiDictUsingClient(
  client: Client,
  guilds: GuildResolvable | GuildResolvable[]
) {
  guilds = Array.isArray(guilds) ? guilds : [guilds];
  const results: NodeJS.Dict<GuildEmoji> = {};
  for (const guild of guilds as GuildResolvable[]) {
    const emojis = client.guilds.resolve(guild)?.emojis.cache;
    emojis?.forEach((emoji) => (results[emoji.name] = emoji));
  }
  return results;
}

export async function sendMessageUsingClient(
  client: Client,
  channel: ChannelResolvable,
  content: string | MessageEmbed,
  publish?: boolean
) {
  const resolvedChannel = await client.channels.fetch(normalizeID(channel));
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
  return sentMessage;
}

export async function getDMChannelUsingClient(
  client: Client,
  user: UserResolvable
) {
  const resolvedUser = await client.users.fetch(normalizeID(user));
  if (!resolvedUser)
    throw new Error(`${resolvedUser} could not be resolved to a user`);

  return await resolvedUser.createDM();
}

export async function editMessageUsingClient(
  client: Client,
  channel: ChannelResolvable,
  message: MessageResolvable,
  content: string | MessageEmbed
) {
  const resolvedChannel = await client.channels.fetch(normalizeID(channel));
  if (!resolvedChannel)
    throw new Error(
      `${channel} could not be resolved to a channel this account has access to`
    );
  if (!resolvedChannel.isText())
    throw new Error(`channel ${channel} is not a text channel`);
  const messageToEdit = await resolvedChannel.messages.fetch(
    normalizeID(message)
  );
  if (!messageToEdit)
    throw new Error(
      `couldn't find message ${message} in channel ${resolvedChannel}`
    );
  await messageToEdit.edit(content);
  return messageToEdit;
}

export async function publishMessageUsingClient(
  client: Client,
  channel: ChannelResolvable,
  message: MessageResolvable
) {
  const resolvedChannel = await client.channels.fetch(normalizeID(channel));
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

  const messageToPublish = await resolvedChannel.messages.fetch(
    normalizeID(message)
  );
  if (!messageToPublish)
    throw new Error(`couldn't find message ${message} in channel ${channel}`);

  await messageToPublish.crosspost();
  return messageToPublish;
}

export async function uploadEmojiListUsingClient(
  client: Client,
  guild: GuildResolvable,
  emoteList: { attachment: BufferResolvable; name: string }[]
) {
  const toUpload = emoteList.map((e) => e.name);
  const storageServer = client.guilds.resolve(guild);
  if (!storageServer) throw new Error("storage server not resolved");
  let currentlyAvailableEmoji = await buildEmojiDictUsingClient(
    client,
    storageServer
  );

  let tryCounter = 0;
  while (true) {
    for (const emote of emoteList) {
      if (!currentlyAvailableEmoji[emote.name]) {
        console.log(`uploading emote for ${emote.name}`);
        await storageServer.emojis.create(emote.attachment, emote.name);
        await sleep(6000);
      }
    }
    currentlyAvailableEmoji = await buildEmojiDictUsingClient(
      client,
      storageServer
    );
    if (toUpload.every((e) => e in currentlyAvailableEmoji)) {
      return currentlyAvailableEmoji as Record<string, GuildEmoji>;
    }
    tryCounter++;
    if (tryCounter > 10) {
      console.log("there are missing emojis. retrying.");
      await sleep(60000);
    } else {
      throw new Error("failed repeatedly to upload emojis");
    }
  }
}

function normalizeID(
  resolvable:
    | UserResolvable
    | ChannelResolvable
    | MessageResolvable
    | GuildResolvable
) {
  return typeof resolvable === "string"
    ? resolvable
    : ((resolvable as any).id as string);
}
