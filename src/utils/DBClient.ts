import { type Collection, type Document, type Db, MongoClient, type ObjectId, type Filter } from "mongodb"
import Config from "./Config"
import type Watcher from "../types/Watcher"
import { logger } from "./logger"

export default class DBClient {
    static client: MongoClient
    static db: Db
    static watchers: Collection<Document>

    static async setup (): Promise<void> {
        DBClient.client = new MongoClient(Config.database.url + Config.database.dbName)
        await DBClient.client.connect()
        DBClient.db = DBClient.client.db(Config.database.dbName)
        DBClient.watchers = DBClient.db.collection("watchers")
    }

    static async close (): Promise<void> {
        await DBClient.client.close()
    }

    static async getWatchers (id?: ObjectId): Promise<Array<Partial<Watcher>>> {
        const query: Filter<Document> = {}
        if (id !== undefined) query._id = id
        return await this.watchers.find(query).toArray() as Array<Partial<Watcher>>
    }

    static async insertWatcher (watcher: Watcher): Promise<ObjectId> {
        if (watcher._id !== undefined) return watcher._id
        const result = await this.watchers.insertOne(watcher)
        logger.debug("Inserted watcher: " + JSON.stringify(watcher, null, 4))
        return result.insertedId
    }

    static async deleteWatcher (id: ObjectId): Promise<void> {
        await this.watchers.deleteOne({ _id: id })
        logger.debug("Deleted watcher with ID: " + id.toString())
    }
}
