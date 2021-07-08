export function meetsConstraints(msg, { allowChannel, allowGuild, allowUser, blockChannel, blockGuild, blockUser, requireChannel, requireGuild, requireUser, }) {
    const { author: { id: authorId }, channel: { id: channelId }, guild: msgGuild, } = msg;
    const guildId = msgGuild === null || msgGuild === void 0 ? void 0 : msgGuild.id;
    // if an allow constraint exists, and it's met, allow
    if ((allowChannel && mixedIncludes(allowChannel, channelId)) ||
        (allowUser && mixedIncludes(allowUser, authorId)) ||
        (allowGuild && guildId && mixedIncludes(allowGuild, guildId)))
        return true;
    // if a block constraint exists, and it's met, block
    if ((blockChannel && mixedIncludes(blockChannel, channelId)) ||
        (blockUser && mixedIncludes(blockUser, authorId)) ||
        (blockGuild && guildId && mixedIncludes(blockGuild, guildId)))
        return false;
    // if a require constraint exists, and it's not met, block
    if ((requireChannel && !mixedIncludes(requireChannel, channelId)) ||
        (requireUser && !mixedIncludes(requireUser, authorId)) ||
        (requireGuild && (!guildId || !mixedIncludes(requireGuild, guildId))))
        return false;
    return true;
}
// via MDN
export function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
}
export function enforceWellStructuredCommand(command) {
    if (typeof command === "string" ||
        (Array.isArray(command) && command.every((s) => typeof s === "string")))
        return;
    throw new Error(`bad command submitted:\n${command}`);
}
export function enforceWellStructuredResponse(response) {
    if (typeof response !== "undefined")
        return;
    throw new Error(`bad response submitted:\n${response}`);
}
export function enforceWellStructuredSlashCommand(command) {
    return;
}
export function enforceWellStructuredSlashResponse(response) {
    return;
}
export function enforceWellStructuredTrigger(trigger) {
    if (trigger instanceof RegExp)
        return;
    throw new Error(`bad trigger submitted:\n${trigger}`);
}
export function mixedIncludes(haystack, needle) {
    return typeof haystack === "string" ? haystack === needle : haystack.includes(needle);
}
