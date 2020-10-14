import { Client } from "discord.js";

export async function doSomethingUsingTempClient<T>(
  apiToken: string,
  something: (client: Client) => Promise<T> | T
) {
  const tempClient = new Client();
  try {
    const resolvesAfterClientDestroyed = new Promise<T>((resolve) => {
      tempClient.on("ready", async () => {
        resolve(await something(tempClient));
      });
    });

    tempClient.login(apiToken);
    return resolvesAfterClientDestroyed;
  } finally {
    tempClient.destroy();
  }
}
