/** turn a MessageComponentInteraction.customId into a dictionary of values */
export declare function deserialize(s: string): ComponentParams & {
    interactionID: string;
};
/** turn a dictionary into a single string, for a component's customId field */
export declare function serialize({ interactionID, ...o }: ComponentParams & {
    interactionID: string;
}): string;
export interface ComponentParams {
    /** the key leading to this paginator's handler function */
    paginatorID?: string;
    /** the initial seed for a paginator, its initial terms, e.g. a slash command search term */
    seed?: string;
    /** a verb like "page" or "pick". the action this button/select should cause */
    operation?: string;
    /** the operation's target, like which page to go to, or which item to pick */
    operand?: string;
}
