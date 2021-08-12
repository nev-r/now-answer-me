import type { Message, User, Emoji, Channel, Guild, GuildMember, GuildEmoji, GuildChannel, Snowflake, ThreadMember } from "discord.js";
export declare function normalizeID(resolvable: User | Message | Channel | Message | Guild | GuildChannel | GuildMember | GuildEmoji | ThreadMember | Snowflake): string;
export declare function normalizeName(resolvable: Emoji | GuildEmoji | string): string | null;
