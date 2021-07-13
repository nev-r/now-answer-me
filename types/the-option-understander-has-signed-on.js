// type ObjectFromObjectIntersection<T> = T extends unknown
// 	? { [K in keyof T]: ObjectFromObjectIntersection<T[K]> }
// 	: T;
// type Cat<A extends string,B extends string> = `${A} ${B}`;
//  type sc<Options> =Options extends {
// 	name: infer Name;
// 	type: infer Identifier;
// 	required?: infer Required;
// 	options?: infer Option;
// 	choices?: infer Choices;
// } []?:'';
const x = {
    name: "test",
    description: "pbbbbbbt",
    options: [
        { name: "abc", description: "ewjrhbgwjhrg", type: "SUB_COMMAND" },
        {
            name: "def",
            description: "fkjerngwikrtjnh",
            type: "SUB_COMMAND_GROUP",
            options: [
                { name: "subsub1", description: "34624563456", type: "SUB_COMMAND" },
                { name: "subsub2", description: "ije4nhfw45gjh", type: "USER" },
            ],
        },
    ],
};
export {};
