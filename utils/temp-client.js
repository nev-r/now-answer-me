import { Client } from "discord.js";
export async function doSomethingUsingTempClient(apiToken, something) {
    const tempClient = new Client({
        intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_EMOJIS_AND_STICKERS"],
    });
    const resolvesThenDestroysClient = new Promise((resolve) => {
        tempClient.on("ready", async () => {
            try {
                const resolution = await something(tempClient);
                resolve(resolution);
            }
            finally {
                tempClient.destroy();
            }
        });
    });
    tempClient.login(apiToken);
    return resolvesThenDestroysClient;
}
