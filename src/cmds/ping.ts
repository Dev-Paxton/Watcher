import { EmbedBuilder, SlashCommandBuilder } from "discord.js"
import Command from "../structures/Command"

export default new Command({
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Ping cmd"),
    execute: async interaction => {
        const embed = new EmbedBuilder()
            .setTitle("🏓 Pong!")
            .setDescription(`Latency: ${Date.now() - interaction.createdTimestamp}ms\n API Latency: ${Math.round(client.ws.ping)}ms`)
        await interaction.reply({ embeds: [embed] })
    }
})
