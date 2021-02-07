import { Client } from "discord.js";
export async function doSomethingUsingTempClient(apiToken, something) {
    const tempClient = new Client();
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
