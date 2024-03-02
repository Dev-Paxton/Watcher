/* eslint-disable no-multiple-empty-lines */
import BotWatcher from "../../src/structures/BotWatcher"
import WatcherManager from "../../src/utils/WatcherManager"
import { ExtendedClient } from "../../src/structures/Client"
import delay from "./delay"
import { logger } from "../../src/utils/logger"
import Config from "../../src/utils/Config"
import DBClient from "../../src/utils/DBClient"

declare let client: ExtendedClient

test("addWatcher", async () => {
    global.client = new ExtendedClient()
    client.start()
    await DBClient.setup()

    const botWatcherAttributes = {
        name: "Invalid Bot",
        intervall: 5 * 60 * 1000,
        userIds: Config.test.userIds,
        channelIds: Config.test.channelIds,
        creatorId: Config.test.userId,
        botId: Config.test.userId + "999",
        botGuildId: Config.test.guildId
    }
    const botWatcher = BotWatcher.from(botWatcherAttributes)

    await WatcherManager.addWatcher(botWatcher)

    expect((await DBClient.getWatchers(botWatcher._id)).at(0)?.name).toBe(botWatcher.name)
    await delay(botWatcher.intervall + 1000)
    expect(WatcherManager.watchers).toStrictEqual([])
    expect(await DBClient.getWatchers(botWatcher._id)).toStrictEqual([])


    botWatcherAttributes.name = "Valid Bot"
    botWatcherAttributes.botId = Config.test.userId
    const botWatcher1 = BotWatcher.from(botWatcherAttributes)

    await WatcherManager.addWatcher(botWatcher1)

    logger.log("test", "Test in 5 seconds if the bot is online")
    await delay(5000)
    expect(WatcherManager.watchers.includes(botWatcher1)).toBeTruthy()
    expect(botWatcher1.status).toBe("online")
    expect((await DBClient.getWatchers(botWatcher1._id)).at(0)?.name).toBe(botWatcher1.name)


    logger.log("test", "Test in 5 seconds if the bot is offline")
    await delay(5000)
    expect(WatcherManager.watchers.includes(botWatcher1)).toBeTruthy()
    expect(botWatcher1.status).toBe("offline")

    await WatcherManager.destroyWatcher(botWatcher1)
    await DBClient.client.close()
    await client.destroy()
}, 20_000)
