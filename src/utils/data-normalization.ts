import type {
	Message,
	User,
	Emoji,
	Channel,
	Guild,
	GuildMember,
	GuildEmoji,
	GuildChannel,
} from "discord.js";

export function normalizeID(
	resolvable:
		| User
		| Message
		| Channel
		| Message
		| Guild
		| GuildChannel
		| GuildMember
		| GuildEmoji
		| string
) {
	return typeof resolvable === "string" ? resolvable : resolvable.id;
}
export function normalizeName(resolvable: Emoji | GuildEmoji | string) {
	return typeof resolvable === "string" ? resolvable : resolvable.name;
}
