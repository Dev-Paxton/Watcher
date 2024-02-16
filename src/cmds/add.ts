import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, type Message, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js"
import Command from "../structures/Command"
import ExtendedEmbedBuilder from "../structures/ExtendedEmbedBuilder"
import { logger } from "../utils/logger"
import BotWatcher from "../structures/BotWatcher"
import WatcherManager from "../utils/WatcherManager"

export default new Command({
    data: new SlashCommandBuilder()
        .setName("add")
        .addStringOption(option => option.setName("name").setDescription("The name of the service").setRequired(true))
        .setDescription("Add a new service to be watched"),
    execute: async interaction => {
        const embed = new ExtendedEmbedBuilder(interaction.user)
            .setTitle("New Service: " + interaction.options.getString("name"))
            .setColor("DarkGreen")
            .setFields({ name: "Type", value: "Select below" })

        const typeMenu = new StringSelectMenuBuilder()
            .setCustomId("typeMenu")
            .setPlaceholder("Select your service type")
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel("Discord Bot")
                    .setValue("bot"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Website")
                    .setValue("website")
            )

        const msg = (await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(typeMenu)] }))

        try {
            const collector = msg.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 })
            collector.once("collect", async i => {
                if (i.values[0] === "bot") {
                    if (interaction.guildId == null) {
                        void interaction.editReply({
                            components: [],
                            embeds: [new ExtendedEmbedBuilder(interaction.user)
                                .setTitle("To set up a bot watcher, you need to be in a server")
                                .setColor("Red")]
                        })
                        return
                    }

                    const botOptions = {
                        name: interaction.options.getString("name"),
                        intervall: 0,
                        userIds: [""],
                        channelIds: [""],
                        creatorId: interaction.user.id,
                        botId: "",
                        botGuildId: interaction.guildId
                    }

                    embed.data.fields?.pop()
                    embed.addFields(
                        { name: "Type", value: "Discord Bot", inline: true },
                        { name: "Intervall", value: "Select below" }
                    )

                    const intervallButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setLabel("5 Minutes")
                            .setCustomId((5 * 60 * 1000).toString())
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setLabel("15 Minutes")
                            .setCustomId((15 * 60 * 1000).toString())
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setLabel("1 Hour")
                            .setCustomId((60 * 60 * 1000).toString())
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setLabel("1 Day")
                            .setCustomId((24 * 60 * 60 * 1000).toString())
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setLabel("Custom")
                            .setCustomId("custom")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true)
                    )

                    const msg = await interaction.editReply({ embeds: [embed], components: [intervallButtons] })

                    try {
                        const response = await msg.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 60000 })
                        botOptions.intervall = parseInt(response.customId)
                        const labelName: Record<string, string> = {
                            300000: "5 Minutes",
                            900000: "15 Minutes",
                            3600000: "1 Hour",
                            86400000: "1 Day"
                        }

                        embed.data.fields?.pop()
                        embed.addFields(
                            { name: "Intervall", value: labelName[response.customId], inline: true },
                            { name: "Bot-Account", value: "Mention the Bot" }
                        )
                        void interaction.editReply({ embeds: [embed], components: [] })

                        let field = "botaccount"

                        const messageCreateListener = (message: Message): void => {
                            if (message.author.id === interaction.user.id) {
                                if (field === "botaccount") {
                                    const bot = message.mentions.users.first()
                                    if (bot != null) {
                                        embed.data.fields?.pop()
                                        embed.addFields(
                                            { name: "Botaccount", value: bot.toString(), inline: true },
                                            { name: "User", value: "Mention users who should be notified\nType none to not notify any user" }
                                        )
                                        embed.setThumbnail(bot.displayAvatarURL())
                                        void interaction.editReply({ embeds: [embed] })

                                        botOptions.botId = bot.id
                                        void message.delete()
                                        field = "user"
                                    }
                                } else if (field === "user") {
                                    if (message.content.toLowerCase().trim() !== "none") {
                                        const users = message.mentions.users
                                        if (users.first() != null) {
                                            embed.data.fields?.pop()
                                            embed.addFields([
                                                { name: "Users", value: users.map(user => user.toString()).join(" "), inline: true },
                                                { name: "Channels", value: "Mention channels where the bot should post notifications\nType none to not post any notifications" }
                                            ])

                                            void interaction.editReply({ embeds: [embed] })
                                            botOptions.userIds = users.map(user => user.id)
                                            void message.delete()
                                            field = "channels"
                                        }
                                    } else {
                                        embed.data.fields?.pop()
                                        embed.addFields([
                                            { name: "Users", value: "None", inline: true },
                                            { name: "Channels", value: "Mention channels where the bot should post notifications\nType none to not post any notifications" }
                                        ])

                                        void interaction.editReply({ embeds: [embed] })
                                        void message.delete()
                                        field = "channels"
                                    }
                                } else if (field === "channels") {
                                    if (message.content.toLowerCase().trim() !== "none") {
                                        const channels = message.mentions.channels
                                        if (channels.first() != null) {
                                            embed.data.fields?.pop()
                                            embed.addFields([
                                                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                                                { name: "Channels", value: channels.map(channel => channel.toString()).join(" "), inline: true }
                                            ])

                                            void interaction.editReply({ embeds: [embed] })
                                            botOptions.channelIds = channels.map(channel => channel.id)
                                            void message.delete()

                                            client.off("messageCreate", messageCreateListener)
                                            collector.stop()

                                            const botWatcher = BotWatcher.from(botOptions as Partial<BotWatcher>)
                                            void WatcherManager.addWatcher(botWatcher)
                                            logger.debug("Created BotWatcher: ")
                                            logger.debug(botWatcher)
                                        }
                                    } else {
                                        embed.data.fields?.pop()
                                        embed.addFields([
                                            { name: "Channels", value: "None", inline: true }
                                        ])

                                        void interaction.editReply({ embeds: [embed] })
                                        void message.delete()

                                        client.off("messageCreate", messageCreateListener)
                                        collector.stop()

                                        const botWatcher = BotWatcher.from(botOptions as Partial<BotWatcher>)
                                        void WatcherManager.addWatcher(botWatcher)
                                        logger.debug("Created BotWatcher")
                                        logger.debug(botWatcher)
                                    }
                                }
                            }
                        }

                        client.addListener("messageCreate", messageCreateListener)
                    } catch (error) {
                        await interaction.editReply({ content: "You took too long to respond!" })
                    }
                }
            })
        } catch (error) {
            await interaction.editReply({ content: "You took too long to respond!" })
        }
    }
})
