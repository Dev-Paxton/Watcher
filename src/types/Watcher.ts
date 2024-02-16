export default interface Watcher {
    watchLoop: NodeJS.Timeout | undefined
    status: "online" | "offline" | undefined
    name: string
    intervall: number
    type: "bot" | "website"
    userIds: string[]
    channelIds: string[]
    creatorId: string

    watch: () => Promise<void>
}
