//
// things which will self-manage after sending
//
import { _newPaginatedEmbed_, _newPaginatedSelector_ } from "./interactive-embeds-base.js";
export async function sendPaginatedEmbed(_) {
    return await _newPaginatedEmbed_(_);
}
export async function sendRerollableEmbed(_) {
    return (await _newPaginatedEmbed_({ ..._, buttons: "random" })).paginatedMessage;
}
export async function sendRerollableStackEmbed(_) {
    return (await _newPaginatedEmbed_({ ..._, buttons: "random" })).paginatedMessage;
}
export async function sendPaginatedSelector(_) {
    return await _newPaginatedSelector_(_);
}
