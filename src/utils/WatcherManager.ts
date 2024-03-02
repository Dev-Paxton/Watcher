import BotWatcher from "../structures/BotWatcher"
import type Watcher from "../types/Watcher"
import DBClient from "./DBClient"
import { logger } from "./logger"

export default class WatcherManager {
    static watchers: Watcher[] = []

    static async loadWatchers (): Promise<void> {
        (await DBClient.getWatchers()).forEach(watcher => {
            if (watcher.type === "bot") void this.addWatcher(BotWatcher.from(watcher))
        })
    }

    static async addWatcher (watcher: Watcher): Promise<boolean> {
        watcher._id = await DBClient.insertWatcher(watcher)
        this.watchers.push(watcher)
        void watcher.watch()
        logger.debug("Added watcher with ID: " + watcher._id.toString())
        return true
    }

    static async destroyWatcher (watcher: Watcher): Promise<void> {
        if (watcher._id !== undefined) await DBClient.deleteWatcher(watcher._id)
        this.watchers.splice(this.watchers.indexOf(watcher), 1)
        clearInterval(watcher.watchLoop)
    }
}
