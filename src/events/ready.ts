import { Events } from "discord.js"
import Event from "../structures/Event"
import { logger } from "../utils/logger"
import WatcherManager from "../utils/WatcherManager"
import Config from "../utils/Config"

export default new Event({
    name: Events.ClientReady,
    once: true,
    execute: async () => {
        logger.info("Ready")
        if (Config.env !== "test") await WatcherManager.loadWatchers()
    }
})
