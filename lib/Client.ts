import type { ClientConfig } from "./interfaces/ClientConfig";
import { v4 } from 'uuid';
import SDK from "./SDK";
import Events from "./Events";
import CommandService from "./services/CommandService";
import type CommandContext from "./interfaces/CommandContext";

export default class Client {

    config: ClientConfig;
    sdk: SDK;
    on: Events;
    commandService: CommandService;

    constructor(config?: Partial<ClientConfig>) {
        // Instantiate Config
        this.config = {
            cacheEntities: config?.cacheEntities ?? true,
            uri: config?.uri ?? 'wss://v3.palringo.com',
            token: config?.token ?? v4(),
            device: config?.device ?? 'web',
            onlineState: config?.onlineState ?? 1,
            invalidateTokenOnClose: config?.invalidateTokenOnClose ?? true
        }

        // Instantiate SDK
        this.sdk = new SDK(this.config);
        this.on = new Events(this.sdk);
        this.commandService = new CommandService(this.sdk);

        this.init();
    }
    
    init = async () => {
        process.on('SIGINT', async () => await this.close());
        process.on('SIGTERM', async () => await this.close());
        process.on('SIGBREAK', async () => await this.close());
        process.on('beforeExit', async () => await this.close());

        await this.on.init();
        await this.sdk.init();
        await this.commandService.init();
    }

    close = async () => {
        if (this.config.invalidateTokenOnClose)
            await this.sdk.security.logout();
            
        await this.commandService.close();
        await this.sdk.close();
        process.exit(0);
    }

    // Security Shortcuts
    login = (username: string, password: string) => this.sdk.security.login(username, password);
    logout = () => this.sdk.security.logout();

    command = (trigger: string, ...fns: ((sdk: SDK, context: CommandContext, next: () => Promise<void>) => Promise<void>)[]) => this.commandService.command(trigger, ...fns);
}