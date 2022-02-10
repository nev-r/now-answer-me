import type {
	Message,
	User,
	Emoji,
	Channel,
	Guild,
	GuildMember,
	GuildEmoji,
	GuildChannel,
	Snowflake,
	ThreadMember,
	PartialDMChannel,
} from "discord.js";

export function normalizeID(
	resolvable:
		| PartialDMChannel
		| User
		| Message
		| Channel
		| Message
		| Guild
		| GuildChannel
		| GuildMember
		| GuildEmoji
		| ThreadMember
		| Snowflake
) {
	return typeof resolvable === "string" ? resolvable : resolvable.id;
}
export function normalizeName(resolvable: Emoji | GuildEmoji | string) {
	return typeof resolvable === "string" ? resolvable : resolvable.name;
}
