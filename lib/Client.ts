import type { ClientConfig } from "./interfaces/ClientConfig";
import { v4 } from 'uuid';
import SDK from "./SDK";
import Events from "./Events";

export default class Client {

    private config: ClientConfig;
    sdk: SDK;
    on: Events;

    constructor(config?: Partial<ClientConfig>) {
        // Instantiate Config
        this.config = {
            uri: config?.uri ?? 'wss://v3.palringo.com',
            token: config?.token ?? v4(),
            device: config?.device ?? 'web',
            onlineState: config?.onlineState ?? 1,
            invalidateTokenOnClose: config?.invalidateTokenOnClose ?? true
        }

        // Instantiate SDK
        this.sdk = new SDK(this.config);
        this.on = new Events(this.sdk);

        this.init();
    }

    private init = async () => {
        process.on('SIGINT', async () => await this.close());
        process.on('SIGTERM', async () => await this.close());
        process.on('SIGBREAK', async () => await this.close());
        process.on('beforeExit', async () => await this.close());

        await this.on.init();
        await this.sdk.init();
    }

    private close = async () => {
        if (this.config.invalidateTokenOnClose)
            await this.sdk.security.logout();
            
        await this.sdk.close();
        process.exit(1);
    }
}