const x = {
    name: "test",
    description: "pbbbbbbt",
    options: [
        { name: "mysubA", description: "fkjwrngktrg", type: "SUB_COMMAND" },
        { name: "mysub0", description: "ewjrhbgwjhrg", type: "SUB_COMMAND" },
        {
            name: "my-sub-command-group-1",
            description: "fkjerngwikrtjnh",
            type: "SUB_COMMAND_GROUP",
            options: [
                { name: "mysub1", description: "34624563456", type: "SUB_COMMAND" },
                { name: "mysub2", description: "ije4nhfw45gjh", type: "SUB_COMMAND" },
            ],
        },
        {
            name: "my-sub-command-group-2",
            description: "fkjerngwikrtjnh",
            type: "SUB_COMMAND_GROUP",
            options: [
                { name: "mysub1", description: "34624563456", type: "SUB_COMMAND" },
                { name: "mysub3", description: "ije4nhfw45gjh", type: "SUB_COMMAND" },
            ],
        },
    ],
};
export {};
