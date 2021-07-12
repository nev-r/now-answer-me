import { escMarkdown } from "one-stone/string";
export async function routeComponentInteraction(interaction) {
    if (interaction.isButton()) {
        interaction.reply({
            ephemeral: true,
            content: `unhandled component interaction 🙂
id: \`${escMarkdown(interaction.customId)}\``,
        });
    }
    else if (interaction.isSelectMenu()) {
        interaction.reply({
            ephemeral: true,
            content: `unhandled component interaction 🙂
id: \`${escMarkdown(interaction.customId)}\`
values submitted: ${interaction.values.map((v) => `\`${escMarkdown(v)}\``).join(" ")}`,
        });
    }
}
