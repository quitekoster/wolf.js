import type { iConfig } from "./Interfaces/iConfig";
import { DeviceType } from "./Types/DeviceType";
import { connect as io } from 'socket.io-client';
import EventEmitter from 'events';
import SecurityManager from "./Managers/Security/SecurityManager";
import MessageManager from "./Managers/Message/MessageManager";

export default class SDK extends EventEmitter {

    private _config: iConfig;
    currentSubscriber: object = {};
    connection: SocketIOClient.Socket;
    security: SecurityManager;
    message: MessageManager;

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

        this.security = new SecurityManager(this);
        this.message = new MessageManager(this);
    }

    _init = async () => {
        this.connection.open();
        this.security._init();
        this.message._init();

        return Promise.resolve();
    }

    _close = async () => {
        if (this._config.deauthToken)
            await this.security.logout();
        
        this.security._close();
        this.message._close();
        this.connection.close();

        return Promise.resolve();
    }

    send = (event: string, data: any = {}) => new Promise((resolve, reject) => {
        if (!data || data === null || data === undefined || typeof data !== 'object')
            data = {};
        else if (!data.headers && !data.body)
            data = { body: data ?? {} }

        this.connection.emit(event, data, res => {
            if (res.code && res.code >= 200 && res.code <= 299)
                resolve(res.body ?? res);
            else
                reject(res);
        });
    });
}