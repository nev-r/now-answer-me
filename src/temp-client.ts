import { Client } from "discord.js";

export async function doSomethingUsingTempClient<T>(
  apiToken: string,
  something: (client: Client) => Promise<T> | T
) {
  const tempClient = new Client();
  const resolvesAfterClientDestroyed = new Promise<T>((resolve) => {
    tempClient.on("ready", async () => {
      const resolution = await something(tempClient);
      tempClient.destroy();
      resolve(resolution);
    });
  });

  tempClient.login(apiToken);
  return resolvesAfterClientDestroyed;
}