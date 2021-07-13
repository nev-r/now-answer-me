import { escMarkdown } from "one-stone/string";
export async function routeComponentInteraction(interaction) {
    if (false) {
        ("something");
    }
    else
        unhandledInteraction(interaction);
}
function unhandledInteraction(interaction) {
    let content = `unhandled component interaction 🙂\nid: \`${escMarkdown(interaction.customId)}\``;
    if (interaction.isSelectMenu()) {
        const values = interaction.values.map((v) => `\`${escMarkdown(v)}\``).join(" ");
        content += `\nvalues submitted: ${values}`;
    }
    interaction.reply({
        ephemeral: true,
        content,
    });
}
