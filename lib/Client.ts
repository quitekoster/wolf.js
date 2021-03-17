import { iConfig, DefaultConfig } from './Interfaces/iConfig';
import SDK from './sdk';

export default class Client {
    sdk: SDK;

    constructor(config: iConfig = DefaultConfig) {
        this.sdk = new SDK(config);
        
        this._init();
    }

    private _init = async () => {
        process.once('SIGTERM', async () => await this._close());
        process.once('SIGINT', async () => await this._close());
        process.on('beforeExit', async () => await this._close());
        
        await this.sdk._init();
    }

    private _close = async () => {
        await this.sdk._close();
    }
}