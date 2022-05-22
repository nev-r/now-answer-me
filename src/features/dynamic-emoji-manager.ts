import { client } from "../bot/index.js";
import { rawCreateDynamicEmojiManager } from "../utils/raw-emoji-manager.js";

export function createDynamicEmojiManager(guilds: string[], drainUntilFree?: number) {
	return rawCreateDynamicEmojiManager(client, guilds, drainUntilFree);
}
