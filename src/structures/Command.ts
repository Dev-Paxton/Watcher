import { type SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js"

export type botExecute = (interaction: ChatInputCommandInteraction) => Promise<void> | void

export default class Command {
    data: SlashCommandBuilder
    execute: botExecute

    constructor (options: {
        data: SlashCommandBuilder
        execute: botExecute
    }) {
        this.data = options.data
        this.execute = options.execute
    }
}
