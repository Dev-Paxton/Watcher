import type Watcher from "../types/Watcher"

export default class WatcherManager {
    static watchers: Watcher[] = []

    static async addWatcher (watcher: Watcher): Promise<void> {
        this.watchers.push(watcher)
        void watcher.watch()
    }

    static destroyWatcher (watcher: Watcher): void {
        this.watchers.splice(this.watchers.indexOf(watcher), 1)
        clearInterval(watcher.watchLoop)
    }
}
