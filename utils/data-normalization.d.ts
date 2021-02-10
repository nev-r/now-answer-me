import type { Message, User, Emoji, Channel, Guild, GuildMember, GuildEmoji, GuildChannel } from "discord.js";
export declare function normalizeID(resolvable: User | Message | Channel | Message | Guild | GuildChannel | GuildMember | GuildEmoji | string): string;
export declare function normalizeName(resolvable: Emoji | GuildEmoji | string): string;
