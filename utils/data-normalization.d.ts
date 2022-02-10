import type { Message, User, Emoji, Channel, Guild, GuildMember, GuildEmoji, GuildChannel, Snowflake, ThreadMember, PartialDMChannel } from "discord.js";
export declare function normalizeID(resolvable: PartialDMChannel | User | Message | Channel | Message | Guild | GuildChannel | GuildMember | GuildEmoji | ThreadMember | Snowflake): string;
export declare function normalizeName(resolvable: Emoji | GuildEmoji | string): string | null;
