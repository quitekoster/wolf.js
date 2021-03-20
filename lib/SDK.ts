import events, { EventEmitter, errorMonitor } from "events";
import { connect as io } from 'socket.io-client';
import type EmitData from "./models/EmitData";
import type SDKConfig from "./interfaces/SDKConfig";
import type Subscriber from './models/Subscriber';
import type SecurityToken from "./models/SecurityToken";
import SecurityHandler from "./handlers/SecurityHandler";
import SubscriberHandler from "./handlers/SubscriberHandler";

export default class SDK extends EventEmitter {

    connection: SocketIOClient.Socket;
    security: SecurityHandler;
    subscriber: SubscriberHandler;
    private config: SDKConfig;

    // Welcome Packet Information
    ip: string;
    country: string;
    token: string;
    avatarEndpoint: string;
    mmsUploadEndpoint: string;
    loggedInUser?: Subscriber;

    // Security Stuff
    securityToken: SecurityToken;

    // Cache Stuff
    cacheEntities: boolean;

    constructor(config: SDKConfig) {
        // Instantiate the Event Emitter
        super({ captureRejections: true });

        // Instantiate an errorMonitor
        this.on(errorMonitor, (err) => {  });

        // Instantiate the config
        this.config = config;

        // Instantiate the Connection object
        this.connection = io(this.config.uri, {
            transports: ['websocket'],
            autoConnect: false,
            reconnection: true,
            query: {
                token: this.config.token,
                device: this.config.device,
                onlineState: this.config.onlineState
            }
        });

        // Instantiate Welcome Data
        this.ip = '0.0.0.0';
        this.country = '';
        this.token = this.config.token;
        this.avatarEndpoint = '';
        this.mmsUploadEndpoint = '';
        this.loggedInUser = undefined;

        // Instantiate Secuirty Stuff
        this.securityToken = { token: '', identity: '' };

        // Instantiate Cache Stuff
        this.cacheEntities = this.config.cacheEntities;

        // Init Handlers
        this.security = new SecurityHandler(this);
        this.subscriber = new SubscriberHandler(this);
    }

    init = async () => {
        this.connection.open();

        await Promise.all([
            this.security.init,
            this.subscriber.init,
        ]);
    }

    close = async () => {
        await Promise.all([
            this.security.close,
            this.subscriber.close
        ]);

        this.connection.close();
    }

    send = (event: string, data: EmitData = {}) => new Promise((resolve, reject) => {
        if (!data.headers && !data.body)
            data = { body: data ?? {} }

        this.connection.emit(event, data, (res: { code: number, body?: object }) => {
            if (res.code >= 200 && res.code <= 299)
                resolve(res.body ?? res);
            else
                reject(res);
        });
    });
}