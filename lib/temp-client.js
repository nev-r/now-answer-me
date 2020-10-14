import { Client } from "discord.js";
export async function doSomethingUsingTempClient(apiToken, something) {
    const tempClient = new Client();
    try {
        const resolvesAfterClientDestroyed = new Promise((resolve) => {
            tempClient.on("ready", async () => {
                resolve(await something(tempClient));
            });
        });
        tempClient.login(apiToken);
        return resolvesAfterClientDestroyed;
    }
    finally {
        tempClient.destroy();
    }
}
