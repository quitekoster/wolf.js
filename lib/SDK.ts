import type { iConfig } from "./Interfaces/iConfig";
import { DeviceType } from "./Types/DeviceType";
import { connect as io } from 'socket.io-client';
import EventEmitter from 'events';

export default class SDK extends EventEmitter {

    private _config: iConfig;
    connection: SocketIOClient.Socket;

    constructor(config: iConfig) {
        super();

        this._config = config;
        const { uri, token, device, onlineState } = config;
        
        this.connection = io(uri, {
            transports: ['websocket'],
            autoConnect: false,
            reconnection: true,
            query: {
                token,
                device,
                onlineState
            }
        });
    }

    _init = async () => {
        this.connection.open();

        return Promise.resolve();
    }

    _close = async () => {
        this.connection.close();

        return Promise.resolve();
    }

}