import { EmbedBuilder, type User } from "discord.js"

export default class ExtendedEmbedBuilder extends EmbedBuilder {
    constructor (user: User) {
        super()
        this.setFooter({ text: "Requested by " + user.username, iconURL: user.displayAvatarURL() })
        this.setTimestamp()
    }
}
