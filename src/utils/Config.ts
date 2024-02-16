import fs from "fs"
import { type BotSettings } from "../types/config"
import path from "path"

const configDirPath = path.join(__dirname, "/../../config")

export default class Config {
    static env: string
    static logLevel: string
    static bot: BotSettings
    static [key: string]: any

    constructor () {
        const configDirFiles = fs.readdirSync(configDirPath).filter(f => f.endsWith(".json"))

        let configFileName = ""
        if (configDirFiles.length === 0) {
            throw new Error("No config file provided")
        } else if (configDirFiles.length === 1) {
            configFileName = configDirFiles[0]
        } else if (process.env.NODE_ENV != null) {
            configFileName = process.env.NODE_ENV + ".json"
        } else {
            configFileName = "prod.json"
        }

        const configJson = JSON.parse(fs.readFileSync(`${configDirPath}/${configFileName}`, "utf-8"))

        for (const setting in configJson) {
            Config[setting] = configJson[setting]
        }

        Config.env = configFileName.split(".")[0]
    }
}

// eslint-disable-next-line no-new
new Config()
