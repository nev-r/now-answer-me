/*
function getReactionEmojiFromString(str: string) {
	// strips out 0xFE0F (VS16 "present this char as an emoji")
	// and 0x20E3 (COMBINING ENCLOSING KEYCAP),
	// turning "1️⃣" into "1"
	str = str.replace(/\uFE0F|\u20E3/g, "");

	// (some emoji are 2 string "chars" long, but one codepoint long)
	// if this seems to be 1 codepoint long
	if ([...str].length === 1) {
		// if it's a number, slap the VS16 and KEYCAP back on
		if (/^[\d*#]$/.test(str)) return str + "\uFE0F\u20E3";
		// if it looks like an emoji, return it as-is
		if (/^\p{Emoji}$/u.test(str)) return str;
	}

	// if tihs is a custom discord emoji, there's a whole markup to parse
	// we try and extract the snowflake id
	const snowflake = str.match(/^<a?:(\w+):(?<snowflake>\d+)>$/)?.groups?.snowflake;
	if (snowflake) str = snowflake;

	// try resolving that snowflake,
	const resolved = client.emojis.resolve(str);
	// and if it worked, return it
	if (resolved) return resolved.id;
}
*/
