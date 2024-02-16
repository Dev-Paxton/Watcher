/* eslint-disable no-multiple-empty-lines */
import BotWatcher from "../../src/structures/BotWatcher"
import WatcherManager from "../../src/utils/WatcherManager"
import { ExtendedClient } from "../../src/structures/Client"
import delay from "./delay"
import { logger } from "../../src/utils/logger"

declare let client: ExtendedClient

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
test("addWatcher", async () => {
    global.client = new ExtendedClient()
    client.start()

    const botWatcherAttributes = {
        name: "Test",
        intervall: 5 * 60 * 1000,
        userIds: [
            ""
        ],
        channelIds: [
            "816737516950126632"
        ],
        creatorId: "282643568332636161",
        botId: "2826435683326361619",
        botGuildId: "707514602434592830"
    }
    const botWatcher = BotWatcher.from(botWatcherAttributes)

    await WatcherManager.addWatcher(botWatcher)
    await delay(botWatcher.intervall + 1000)

    expect(WatcherManager.watchers).toStrictEqual([])


    botWatcherAttributes.botId = "282643568332636161"
    const botWatcher1 = BotWatcher.from(botWatcherAttributes)
    logger.debug(botWatcher1)

    await WatcherManager.addWatcher(botWatcher1)
    logger.log("test", "Test in 5 seconds if the bot is online")
    await delay(6000)

    expect(WatcherManager.watchers.includes(botWatcher1)).toBeTruthy()
    expect(botWatcher1.status).toBe("online")


    logger.log("test", "Test in 5 seconds if the bot is offline")
    await delay(6000)

    expect(WatcherManager.watchers.includes(botWatcher1)).toBeTruthy()
    expect(botWatcher1.status).toBe("offline")

    WatcherManager.destroyWatcher(botWatcher1)
    await client.destroy()
}, 15_000 + 15_000)
