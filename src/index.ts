import { ExtendedClient } from "./structures/Client"

declare let client: ExtendedClient
global.client = new ExtendedClient()
client.start()
