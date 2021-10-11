const ser = {
    operation: "\u240E",
    operand: "\u240F",
    paginatorID: "\u240C",
    seed: "\u241D", // ␝
};
const de = {
    "\u240E": "operation",
    "\u240F": "operand",
    "\u240C": "paginatorID",
    "\u241D": "seed", // ␝
};
const r = new RegExp(`(${Object.keys(de).join("|")})`, "g");
export function deserialize(s) {
    const a = s.split(r);
    const interactionID = a.shift();
    const o = { interactionID };
    while (a.length) {
        const k_ = a.shift();
        const v = a.shift();
        if (k_ && k_ in de) {
            o[de[k_]] = v;
        }
    }
    return o;
}
export function serialize({ interactionID, ...o }) {
    let s = interactionID;
    for (const k in o) {
        const v = o[k];
        if (v !== undefined)
            s += ser[k] + v;
    }
    return s;
}
