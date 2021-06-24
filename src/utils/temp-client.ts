import { Client } from "discord.js";

export async function doSomethingUsingTempClient<T>(
	apiToken: string,
	something: (client: Client) => Promise<T> | T
) {
	const tempClient = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_EMOJIS"] });
	const resolvesThenDestroysClient = new Promise<T>((resolve) => {
		tempClient.on("ready", async () => {
			try {
				const resolution = await something(tempClient);
				resolve(resolution);
			} finally {
				tempClient.destroy();
			}
		});
	});

	tempClient.login(apiToken);
	return resolvesThenDestroysClient;
}
