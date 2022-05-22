import { client } from "../bot/index.js";
import { rawCreateDynamicEmojiManager } from "../utils/raw-emoji-manager.js";
export function createDynamicEmojiManager(guilds, drainUntilFree) {
    return rawCreateDynamicEmojiManager(client, guilds, drainUntilFree);
}
