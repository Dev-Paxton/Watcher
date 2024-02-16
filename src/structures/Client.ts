import { Client, Collection, GatewayIntentBits } from "discord.js"
import Config from "../utils/Config"
import type Command from "./Command"
import fs from "fs"
import type Event from "./Event"
import path from "path"
import { type botExecute } from "./Command"

const intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
]

export class ExtendedClient extends Client {
    commands = new Collection<string, botExecute>()

    constructor () {
        super({ intents })
    }

    start (): void {
        void this.registerModules()
        void this.login(Config.bot.token)
    }

    async registerModules (): Promise<void> {
        const fileExtension = __filename.slice(-3)

        // Commands
        const cmdDirPath = path.join(__dirname, "/../cmds/")
        const cmdFiles = fs.readdirSync(cmdDirPath).filter(file => file.endsWith(fileExtension))

        for (const file of cmdFiles) {
            const cmd: Command = (await import(cmdDirPath + file)).default
            this.commands.set(cmd.data.name, cmd.execute)
        }

        // Events
        const eventDirPath = path.join(__dirname, "/../events/")
        const eventFiles = fs.readdirSync(eventDirPath).filter(file => file.endsWith(fileExtension))

        for (const file of eventFiles) {
            const event: Event = (await import(eventDirPath + file)).default

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            if (event.once) this.once(event.name, async (...args) => { await event.execute(...args) })
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            else this.on(event.name, async (...args) => { await event.execute(...args) })
        }
    }
}
