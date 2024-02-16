import winston, { format } from "winston"
import Config from "./Config"

const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
        test: 4
    },
    colors: {
        error: "red",
        warn: "yellow",
        info: "green",
        debug: "blue",
        test: "cyan"
    }
}

const customFormat = format.printf(info => {
    if (typeof info.message === "object") {
        info.message = JSON.stringify(info.message, null, 4)
    }

    const head = `${timeFormat()} ${info.level}: `

    let space = ""
    while (head.length + space.length < 45) {
        space = space + " "
    }
    return head + space + info.message
})

function timeFormat (): string {
    const date = new Date()
    return `[${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1).toString().padStart(2, "0")}.${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}]`
}

const loggerFormat = format.combine(format.colorize(), customFormat)

export const logger = winston.createLogger({
    levels: customLevels.levels,
    level: "debug",
    format: loggerFormat,
    transports: [
        new winston.transports.Console({
            level: Config.logLevel
        }),
        new winston.transports.File({
            filename: "./logs/watcher.log",
            level: "debug",
            maxsize: 5000000
        })
    ]
})

winston.addColors(customLevels.colors)
