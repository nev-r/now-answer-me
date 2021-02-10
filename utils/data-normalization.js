export function normalizeID(resolvable) {
    return typeof resolvable === "string" ? resolvable : resolvable.id;
}
export function normalizeName(resolvable) {
    return typeof resolvable === "string" ? resolvable : resolvable.name;
}
