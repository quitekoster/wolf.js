import Events from './Events';
import { iConfig, DefaultConfig } from './Interfaces/iConfig';
import SDK from './sdk';

export default class Client {
    sdk: SDK;
    on: Events;

    constructor(config: iConfig = DefaultConfig) {
        this.sdk = new SDK(config);
        this.on = new Events(this.sdk);
        
        this._init();
    }

    private _init = async () => {
        process.once('SIGTERM', async () => await this._close());
        process.once('SIGINT', async () => await this._close());
        process.on('beforeExit', async () => await this._close());

        await this.on._init();
        await this.sdk._init();
    }

    private _close = async () => {
        await this.sdk._close();
        await this.on._close();
    }

    login = (username: string, password: string) => this.sdk.security.login(username, password);
    logout = () => this.sdk.security.logout();
}