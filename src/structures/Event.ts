export default class Event {
    name: string
    once: boolean
    execute: (...args: any) => Promise<void> | void

    constructor (public options: {
        name: string
        once?: boolean
        execute: (...args: any) => Promise<void> | void
    }) {
        this.name = options.name
        this.once = options.once ?? false
        this.execute = options.execute
    }
}
