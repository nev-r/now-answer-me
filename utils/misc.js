//
// delayed resolvers
//
/** try to do whatever func wants to do, but delete msg if there's an error */
export async function bugOut(msg, func) {
    try {
        return await func();
    }
    catch (e) {
        await delMsg(msg);
        throw e;
    }
}
export async function delMsg(msg) {
    try {
        (msg === null || msg === void 0 ? void 0 : msg.deletable) && !msg.deleted && (await msg.delete());
    }
    catch (e) {
        console.log(e);
    }
    return;
}
export function boolFilter(arr) {
    return arr.filter(Boolean);
}
