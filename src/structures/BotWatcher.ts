/* eslint-disable @typescript-eslint/indent */
import { type ObjectId } from "mongodb"
import type Watcher from "../types/Watcher"
import Config from "../utils/Config"
import WatcherManager from "../utils/WatcherManager"
import { logger } from "../utils/logger"
import ExtendedEmbedBuilder from "./ExtendedEmbedBuilder"

export default class BotWatcher implements Watcher {
    _id: ObjectId | undefined
    watchLoop: NodeJS.Timeout | undefined
    status: "online" | "offline" | undefined
    name: string
    intervall: number
    type: "bot" | "website"
    userIds: string[]
    channelIds: string[]
    creatorId: string
    botId: string
    botGuildId: string

    constructor (name: string, intervall: number, userIds: string[], channelIds: string[], creatorId: string, botId: string, botGuildId: string, id?: ObjectId) {
        if (Config.env === "dev" || Config.env === "test") intervall = intervall / 60
        this.name = name
        this.intervall = intervall
        this.type = "bot"
        this.userIds = userIds
        this.channelIds = channelIds
        this.creatorId = creatorId
        this.botId = botId
        this.botGuildId = botGuildId
        this._id = id

        logger.debug("Created new BotWatcher: " + JSON.stringify(this, null, 4))
    }

    static from (options: Partial<BotWatcher>): BotWatcher {
        if (options.name == null) throw new Error("Name is required")
        if (options.intervall == null) throw new Error("Intervall is required")
        if (options.botId == null) throw new Error("Bot ID is required")
        if (options.botGuildId == null) throw new Error("Bot Guild ID is required")
        if (options.creatorId == null) throw new Error("Creator ID is required")
        if (options.userIds == null && options.channelIds == null) throw new Error("User IDs or Channel IDs are required")

        return new BotWatcher(
            options.name,
            options.intervall,
            options.userIds ?? [],
            options.channelIds ?? [],
            options.creatorId,
            options.botId,
            options.botGuildId,
            options._id
        )
    }

    async watch (): Promise<void> {
        const guild = await client.guilds.fetch(this.botGuildId)
        this.status = "online"
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.watchLoop = setInterval(async () => {
            const bot = await guild.members.fetch(this.botId).catch(e => null)
            if (bot === null) {
                logger.warn("Couldn't find the bot from service " + this.name)
                void WatcherManager.destroyWatcher(this)
                return
            }

            if (bot?.presence?.status === "offline") {
                if (this.status === "offline") return
                this.status = "offline"

                const creator = await client.users.fetch(this.creatorId)
                const embed = new ExtendedEmbedBuilder(creator)
                    .setTitle(this.name + " is down!")
                    .setDescription(`The Bot ${bot.toString()} is offline`)
                    .setThumbnail(bot.user.displayAvatarURL())
                    .setColor("Red")

                for (const userId of this.userIds) {
                    const user = await client.users.fetch(userId).catch(e => null)
                    if (user !== null) {
                        await user.send({ embeds: [embed] })
                    }
                }

                for (const channelId of this.channelIds) {
                    const channel = await client.channels.fetch(channelId).catch(e => null)
                    if (channel !== null) {
                        if (channel.isTextBased()) await channel.send({ embeds: [embed] })
                    }
                }
            } else this.status = "online"
        }, this.intervall)
    }
}
