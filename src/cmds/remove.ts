import { SlashCommandBuilder } from "discord.js"
import Command from "../structures/Command"
import WatcherManager from "../utils/WatcherManager"
import ExtendedEmbedBuilder from "../structures/ExtendedEmbedBuilder"

export default new Command({
    data: new SlashCommandBuilder()
        .setName("remove")
        .addStringOption(option => option.setName("name").setDescription("The name of the service to remove").setRequired(true))
        .setDescription("Remove a watcher"),
    execute: async interaction => {
        WatcherManager.watchers.filter(watcher => watcher.name === interaction.options.getString("name")).forEach(watcher => {
            void WatcherManager.destroyWatcher(watcher)
        })

        const embed = new ExtendedEmbedBuilder(interaction.user)
            .setTitle("Removed service " + interaction.options.getString("name"))
            .setColor("Green")
        await interaction.reply({ embeds: [embed] })
    }
})
