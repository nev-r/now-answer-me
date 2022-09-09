import type { Client, GuildEmoji } from "discord.js";
import { arrayify } from "one-stone/array";
import { sleep } from "one-stone/promise";
import { buildEmojiDictUsingClient } from "./raw-utils.js";

/** the client must be connected to use this */
export function rawCreateDynamicEmojiManager(
	client: Client,
	guilds: string[],
	drainUntilFree = 10
) {
	let isReady = false;
	let emojiDict: NodeJS.Dict<GuildEmoji> = {};
	const perGuildEmptySlots: Record<string, number> = {};
	let drainTimer: NodeJS.Timeout | undefined;

	client.on("shardDisconnect", () => {
		if (drainTimer !== undefined) clearTimeout(drainTimer);
	});
	// do initial setup once the client has connected and guilds are available
	(async () => {
		await (client.isReady()
			? true
			: new Promise((resolve) => {
					(client as Client<true>).on("ready", () => resolve(true));
			  }));
		// filter out bad guilds
		guilds = guilds.filter((guild) => {
			if (client.guilds.resolve(guild)) return true;
			console.log(`guild unavailable or unresolvable: ${guild}`);
		});
		// build initial emoji cache
		emojiDict = buildEmojiDictUsingClient(client, guilds);

		// build perGuildEmptySlots
		takeStock();
		// dispatch this but no need to wait for it
		drainOldEmoji();
		// we're ready enough to start taking requests
		isReady = true;

		let spacesAvailable = 0;
		for (const k in perGuildEmptySlots) spacesAvailable += perGuildEmptySlots[k];
		console.log(
			`initialized an emoji manager using ${guilds.length} servers with ${spacesAvailable} slots`
		);
	})();

	return upload;

	async function upload(emoji: { attachment: string | Buffer; name: string }): Promise<GuildEmoji>;
	async function upload(
		emojis: { attachment: string | Buffer; name: string }[]
	): Promise<NodeJS.Dict<GuildEmoji>>;
	async function upload(
		emojis:
			| {
					attachment: string | Buffer;
					name: string;
			  }
			| {
					attachment: string | Buffer;
					name: string;
			  }[]
	): Promise<NodeJS.Dict<GuildEmoji> | GuildEmoji> {
		if (!isReady) throw "dynamic emoji uploader was called before client was connected";

		// clear room first if needed
		takeStock();
		const deDupe = new Set<string>();

		const emojiList = arrayify(emojis).filter((e) => {
			const had = deDupe.has(e.name);
			deDupe.add(e.name);
			return !had;
		});
		const spacesNeeded = emojiList.length;
		console.log(`uploading/locating ${spacesNeeded} emoji`);
		let spacesAvailable = 0;
		for (const k in perGuildEmptySlots) spacesAvailable += perGuildEmptySlots[k];
		console.log(`${spacesAvailable} spaces available across ${guilds.length} guilds`);
		if (spacesNeeded + guilds.length > spacesAvailable) {
			const spaceToClearOnEach = Math.floor(spacesNeeded / guilds.length) + 1;
			await Promise.all(guilds.map((gid) => drainServer(gid, spaceToClearOnEach)));
		}

		// multiple emojis submitted. return the entire dict.
		if (Array.isArray(emojis)) {
			const uploadEmojiList = emojiList.filter((emoji) => !(emoji.name in emojiDict));
			console.log(`uploading ${uploadEmojiList.length} emoji`);
			await Promise.all(
				uploadEmojiList.map(async (e, i) => {
					await sleep(i * 20);
					const emptiest = getEmptiest();
					const uploadGuild = client.guilds.resolve(emptiest);
					if (!uploadGuild) throw `guild ${emptiest} was unavailable..`;
					perGuildEmptySlots[emptiest]--;
					try {
						const newEmoji = await uploadGuild.emojis.create({
							attachment: e.attachment,
							name: e.name,
						});
						emojiDict[e.name] = newEmoji;
					} catch {
						perGuildEmptySlots[emptiest]++;
						throw `upload to ${emptiest} failed`;
					}
				})
			);
			if (drainTimer === undefined) drainTimer = setTimeout(drainOldEmoji, 300000);
			return emojiDict;
		}
		// only one emoji submitted. return that alone
		else {
			if (emojiDict[emojis.name]) return emojiDict[emojis.name]!;
			else {
				const emptiest = getEmptiest();
				const uploadGuild = client.guilds.resolve(emptiest);
				if (!uploadGuild) throw `guild ${emptiest} was unavailable..`;
				perGuildEmptySlots[emptiest]--;
				try {
					const newEmoji = await uploadGuild.emojis.create({
						attachment: emojis.attachment,
						name: emojis.name,
					});
					emojiDict[emojis.name] = newEmoji;
					return newEmoji;
				} catch (e) {
					console.log(e);
					perGuildEmptySlots[emptiest]++;
					throw `upload to ${emptiest} failed`;
				}
			}
		}
	}

	function getFreeSlots(gid: string) {
		const g = client.guilds.resolve(gid);
		// assume unresolvable guilds are full
		return 50 - (g?.emojis.cache.size ?? 50);
	}
	function takeStock() {
		for (const gid of guilds) perGuildEmptySlots[gid] = getFreeSlots(gid);
	}

	function getEmptiest() {
		let highest = 0;
		for (const gid in perGuildEmptySlots) {
			const c = perGuildEmptySlots[gid];
			if (c > highest) highest = c;
		}
		if (highest === 0) throw "all servers are full";
		for (const gid in perGuildEmptySlots) if (perGuildEmptySlots[gid] === highest) return gid;
		throw "getEmptiest failed";
	}

	async function drainOldEmoji() {
		for (const gid of guilds) {
			await drainServer(gid, drainUntilFree);
		}
		emojiDict = buildEmojiDictUsingClient(client, guilds);
		takeStock();
		drainTimer = undefined;
	}

	async function drainServer(gid: string, drainServerUntilFree: number) {
		console.log(`ensuring ${gid} has ${drainServerUntilFree} slots free`);
		const allEmojis = [...(client.guilds.resolve(gid)?.emojis.cache.values() ?? [])];
		allEmojis.sort(oldestEmojiLast);
		let errorCount = 0;
		while (50 - allEmojis.length < drainServerUntilFree) {
			if (client.isReady()) {
				console.log("skipping drain. client is offline.");
				return;
			}
			const emoji = allEmojis.pop();
			if (emoji) {
				try {
					await sleep(10000);
					console.log(`deleting ${emoji.name} in ${emoji.guild.id}`);
					await emoji.delete();
					perGuildEmptySlots[gid]++;
					delete emojiDict[emoji.name!];
					errorCount = 0;
				} catch (err) {
					console.log(`error while draining ${emoji.name}:`);
					console.log(`${err}`);
					errorCount++;

					// if errors are stacking, wait a half hour
					if (errorCount) await sleep(1800000);

					if (errorCount > 3)
						throw `something went majorly wrong and let's not get cloudflare banned`;
				}
			}
		}
	}
}

function oldestEmojiLast(e1: GuildEmoji, e2: GuildEmoji) {
	return e2.createdTimestamp - e1.createdTimestamp;
}
