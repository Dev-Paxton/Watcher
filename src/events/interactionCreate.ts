import { type BaseInteraction, Events } from "discord.js"
import Event from "../structures/Event"
import { logger } from "../utils/logger"

export default new Event({
    name: Events.InteractionCreate,
    execute: async (interaction: BaseInteraction) => {
        if (interaction.isStringSelectMenu()) void interaction.deferUpdate()

        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName)

            if (command == null) {
                logger.warn(`Command [${interaction.commandName}] not found`)
                return
            }

            try {
                await command(interaction)
            } catch (error) {
                logger.error(error)
                if (interaction.replied || interaction.deferred) await interaction.followUp({ content: "There was an error while executing this command", ephemeral: true })
                else await interaction.reply({ content: "There was an error while executing this command", ephemeral: true })
            }
        }
    }
})
