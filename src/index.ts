import { ExtendedClient } from "./structures/Client"
import DBClient from "./utils/DBClient"

declare let client: ExtendedClient
global.client = new ExtendedClient()
client.start()
void DBClient.setup()
