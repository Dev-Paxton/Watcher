import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, UserSelectMenuBuilder, type StringSelectMenuInteraction, type UserSelectMenuInteraction, ChannelSelectMenuBuilder, type ChannelSelectMenuInteraction, type InteractionCollector, ChannelType, type User, Collection, type APIChannel, type Channel } from "discord.js"
import Command from "../structures/Command"
import ExtendedEmbedBuilder from "../structures/ExtendedEmbedBuilder"
import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "@discordjs/builders"
import BotWatcher from "../structures/BotWatcher"
import WatcherManager from "../utils/WatcherManager"
import type Watcher from "../types/Watcher"

export default new Command({
    data: new SlashCommandBuilder()
        .setName("add")
        .addStringOption(option => option.setName("name").setDescription("The name of the service").setRequired(true))
        .setDescription("Add a new service to be watched"),
    execute: async interaction => {
        const watcherOptions: Partial<BotWatcher> = {
            name: interaction.options.getString("name") ?? "undefined",
            creatorId: interaction.user.id
        }

        const embed = new ExtendedEmbedBuilder(interaction.user)
            .setTitle("New Service: " + interaction.options.getString("name"))
            .setColor("DarkGreen")
        const collectorFilter: any = (i: StringSelectMenuInteraction): boolean => i.user.id === interaction.user.id

        const type = await getType()
        if (type === undefined) return
        else if (type === "bot") {
            if (interaction.inGuild()) {
                watcherOptions.botGuildId = interaction.guild?.id

                const botId = await getBotId()
                if (botId === undefined) return
                watcherOptions.botId = botId
            } else {
                void interaction.editReply({
                    components: [],
                    embeds: [new ExtendedEmbedBuilder(interaction.user)
                        .setDescription("Error: To set up a bot watcher, you need to be in a server!")
                        .setColor("Red")]
                })
                return
            }
        } else if (type === "website") {
            embed.setDescription("Error: This feature is not yet implemented!")
            embed.setColor("Red")
            void interaction.editReply({ embeds: [embed], components: [] })
            return
        }
        watcherOptions.type = type

        const intervall = await getIntervall()
        // if (intervall === undefined) return
        watcherOptions.intervall = intervall

        const channelType = await getChannelType()
        if (channelType === undefined) return

        const userAndChannel = await getUserAndChannelIds(channelType)
        if (userAndChannel === undefined) return
        watcherOptions.userIds = userAndChannel[0]
        watcherOptions.channelIds = userAndChannel[1]

        embed.addFields({ name: "Created?", value: "Pending ⌛", inline: true })
        await interaction.editReply({ embeds: [embed], components: [] })

        let watcher: Watcher
        /* if (type === "bot") */ watcher = BotWatcher.from(watcherOptions)
        /* else watcher = WebsiteWatcher.from(watcherOptions) */

        const created = await WatcherManager.addWatcher(watcher)
        if (created) {
            embed.data.fields?.pop()
            embed.addFields({ name: "Created?", value: "✅", inline: true })
        } else {
            embed.data.fields?.pop()
            embed.addFields({ name: "Created?", value: "Error ❌", inline: true })
        }

        await interaction.editReply({ embeds: [embed], components: [] })

        // Functions
        async function getType (): Promise<BotWatcher["type"] | undefined> {
            embed.setFields({ name: "Type", value: "Select below" })

            const selectTypeMenu = new StringSelectMenuBuilder()
                .setCustomId("type")
                .setPlaceholder("Select your service type")
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Discord Bot")
                        .setValue("bot"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Website")
                        .setValue("website")
                )

            const response = await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectTypeMenu)] })

            try {
                const stringSelectMenuInteraction = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 }) as StringSelectMenuInteraction
                const type = stringSelectMenuInteraction.values[0]
                embed.data.fields?.pop()
                embed.addFields({ name: "Type", value: (selectTypeMenu.options.find((menu) => menu.data.value === type))?.data.label ?? "undefined", inline: true })
                return type as BotWatcher["type"]
            } catch (error) {
                embed.setDescription("Error: You took too long to respond!")
                embed.setColor("Red")
                await interaction.editReply({ embeds: [embed], components: [] })
                return undefined
            }
        }

        async function getBotId (): Promise<string | undefined> {
            embed.addFields({ name: "Bot", value: "Select below" })

            const selectBotMenu = new UserSelectMenuBuilder()
                .setCustomId("bot")
                .setPlaceholder("Select the bot")

            const response = await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(selectBotMenu)] })

            try {
                const userSelectMenuInteraction = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 }) as UserSelectMenuInteraction
                const bot = userSelectMenuInteraction.users.get(userSelectMenuInteraction.values[0])
                if (bot === undefined) return undefined
                embed.data.fields?.pop()
                embed.addFields({ name: "Bot", value: bot.toString(), inline: true })
                embed.setThumbnail(bot.displayAvatarURL())
                await userSelectMenuInteraction.update({ embeds: [embed], components: [] })
                return bot.id
            } catch {
                embed.setDescription("Error: You took too long to respond!")
                embed.setColor("Red")
                await interaction.editReply({ embeds: [embed], components: [] })
                return undefined
            }
        }

        async function getIntervall (): Promise<number | undefined> {
            embed.addFields({ name: "Intervall", value: "Select below" })

            const intervallButtons = [
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
                    .setLabel("1 Week")
                    .setCustomId((7 * 24 * 60 * 60 * 1000).toString())
                    .setStyle(ButtonStyle.Primary)
            ]

            const response = await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(intervallButtons)] })

            try {
                const buttonInteraction = await response.awaitMessageComponent({ filter: collectorFilter, time: 5_000 })
                let intervall = parseInt(buttonInteraction.customId)
                intervall = intervall / 1000 / 60
                let intervallLabel = intervall + " Minute(s)"
                intervall = intervall / 60
                if (intervall >= 1) {
                    intervallLabel = intervall + " Hour(s)"
                    intervall = intervall / 24
                    if (intervall >= 1) {
                        intervallLabel = intervall + " Day(s)"
                    }
                }
                embed.data.fields?.pop()
                embed.addFields({ name: "Intervall", value: intervallLabel, inline: true })
                await buttonInteraction.update({ embeds: [embed], components: [] })
                return parseInt(buttonInteraction.customId)
            } catch (error) {
                embed.setDescription("Error: You took too long to respond!")
                embed.setColor("Red")
                await interaction.editReply({ embeds: [embed], components: [] })
                return undefined
            }
        }

        async function getChannelType (): Promise<"user" | "channel" | "userchannel" | undefined> {
            embed.addFields({ name: "Who would you like to notify?", value: "‎" })

            const channelTypeButtons = [
                new ButtonBuilder()
                    .setLabel("User")
                    .setCustomId("user")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setLabel("Channel")
                    .setCustomId("channel")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setLabel("User & Channel")
                    .setCustomId("userchannel")
                    .setStyle(ButtonStyle.Primary)
            ]

            const response = await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(channelTypeButtons)] })

            try {
                const buttonInteraction = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 })
                embed.data.fields?.pop()
                await buttonInteraction.update({ embeds: [embed], components: [] })
                return buttonInteraction.customId as "user" | "channel" | "userchannel"
            } catch (error) {
                embed.setDescription("Error: You took too long to respond!")
                embed.setColor("Red")
                await interaction.editReply({ embeds: [embed], components: [] })
                return undefined
            }
        }

        async function getUserAndChannelIds (channelType: "user" | "channel" | "userchannel"): Promise<[string[], string[]] | undefined> {
            const components: Array<ActionRowBuilder<UserSelectMenuBuilder | ChannelSelectMenuBuilder>> = []
            if (channelType.includes("user")) {
                embed.addFields({ name: "User(s)", value: "User(s) who should be notified" })

                const selectUsersMenu = new UserSelectMenuBuilder()
                    .setCustomId("user")
                    .setPlaceholder("Select user(s) who should be notified")
                    .setMaxValues(25)
                components.push(new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(selectUsersMenu))
            }

            if (channelType.includes("channel")) {
                embed.addFields({ name: "Channel(s)", value: "Channel(s) who should be notified" })

                const selectChannelMenu = new ChannelSelectMenuBuilder()
                    .setCustomId("channel")
                    .setPlaceholder("Select channel(s) who should be notified")
                    .setMaxValues(25)
                    .addChannelTypes(ChannelType.GuildText)
                components.push(new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(selectChannelMenu))
            }

            const response = await interaction.editReply({ embeds: [embed], components })

            const interactionCollector = response.createMessageComponentCollector({ max: components.length, filter: collectorFilter, time: 60_000 }) as InteractionCollector<UserSelectMenuInteraction | ChannelSelectMenuInteraction>

            let users = new Collection<string, User>()
            let channels = new Collection<string, Channel | APIChannel>()
            interactionCollector.on("collect", async menuInteraction => {
                if (menuInteraction.isUserSelectMenu()) {
                    users = menuInteraction.users
                    embed.data.fields?.splice(embed.data.fields?.findIndex(field => field.name === "User(s)"), 1)
                    embed.addFields({ name: "User(s)", value: (users.map(user => user.toString())).toString(), inline: true })
                    components.splice(0, 1)
                } else if (menuInteraction.isChannelSelectMenu()) {
                    channels = menuInteraction.channels
                    embed.data.fields?.splice(embed.data.fields?.findIndex(field => field.name === "Channel(s)"), 1)
                    components.splice(components.length - 1, 1)
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    embed.addFields({ name: "Channel(s)", value: (channels.map(channel => channel.toString())).toString(), inline: true })
                }
                if (components[0] === undefined) await menuInteraction.update({ embeds: [embed], components: [] })
                else await menuInteraction.update({ embeds: [embed], components: [components[0]] })
            })

            return await new Promise(resolve => {
                interactionCollector.on("end", async (collected, reason) => {
                    if (reason === "time") {
                        embed.setDescription("Error: You took too long to respond!")
                        embed.setColor("Red")
                        await interaction.editReply({ embeds: [embed], components: [] })
                        resolve(undefined)
                    }
                    for (const id in collected) {
                        const menuInteraction = collected.get(id)
                        if (menuInteraction === undefined) continue
                        if (!menuInteraction.replied) await menuInteraction.update({ embeds: [embed], components: [] })
                    }
                    resolve([users.map(user => user.id), channels.map(channel => channel.id)])
                })
            })
        }
    }
})
