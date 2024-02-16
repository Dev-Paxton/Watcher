import { Events } from "discord.js"
import Event from "../structures/Event"
import { logger } from "../utils/logger"

export default new Event({
    name: Events.ClientReady,
    once: true,
    execute: async () => {
        logger.info("Ready")
    }
})
