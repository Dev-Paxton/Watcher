import fs from "fs"
import type Command from "./structures/Command"
import { REST, Routes } from "discord.js"
import Config from "./utils/Config"
import { logger } from "./utils/logger"
import path from "path"

void (async () => {
    const commands = []
    const fileExtension = __filename.slice(-3)
    const cmdDirPath = path.join(__dirname, "/cmds/")

    const cmdFiles = fs.readdirSync(cmdDirPath).filter(file => file.endsWith(fileExtension))

    for (const file of cmdFiles) {
        const cmd: Command = (await import(cmdDirPath + file)).default
        commands.push(cmd.data)
    }

    const rest = new REST().setToken(Config.bot.token)

    try {
        logger.info(`Started refreshing ${commands.length} commands`)
        await rest.put(
            Routes.applicationCommands(Config.bot.id),
            { body: commands }
        )
        logger.info("Successfulley reloaded commands")
    } catch (error) {
        logger.error(error)
    }
})()
