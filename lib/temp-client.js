import { Client } from "discord.js";
export async function doSomethingUsingTempClient(apiToken, something) {
    const tempClient = new Client();
    const resolvesAfterClientDestroyed = new Promise((resolve) => {
        tempClient.on("ready", async () => {
            const resolution = await something(tempClient);
            tempClient.destroy();
            resolve(resolution);
        });
    });
    tempClient.login(apiToken);
    return resolvesAfterClientDestroyed;
}
