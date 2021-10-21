const ser = {
	operation: "\u240E", // ␎
	operand: "\u240F", // ␏
	paginatorID: "\u240C", // ␌
	seed: "\u241D", // ␝
};

const de = {
	"\u240E": "operation", // ␎
	"\u240F": "operand", // ␏
	"\u240C": "paginatorID", // ␌
	"\u241D": "seed", // ␝
} as const;

type SpecialChar = keyof typeof de;
type Label = keyof typeof ser;

const r = new RegExp(`(${Object.keys(de).join("|")})`, "g");

/** turn a MessageComponentInteraction.customId into a dictionary of values */
export function deserialize(s: string) {
	const a = s.split(r);
	const interactionID = a.shift()!;
	const o: ComponentParams & { interactionID: string } = { interactionID };
	while (a.length) {
		const k_ = a.shift();
		const v = a.shift();
		if (k_ && k_ in de) {
			o[de[k_ as SpecialChar]] = v;
		}
	}
	return o;
}

/** turn a dictionary into a single string, for a component's customId field */
export function serialize({ interactionID, ...o }: ComponentParams & { interactionID: string }) {
	let s = interactionID;
	for (const k in o) {
		const v = o[k as Label];
		if (v !== undefined) s += ser[k as Label] + v;
	}
	return s;
}

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
