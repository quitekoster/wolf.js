import type { SDK } from ".";
import { MessageType } from "./Types/MessageType";
import SdkEvents from "./Types/SdkEvents";

export default class Events {
    private sdk: SDK;

    constructor(sdk: SDK) { 
        this.sdk = sdk;
    }

    _init = async () => {
        this.welcome = this.OnWelcome;
        this.loginSuccess = this.OnLoginSuccess;
        this.sdk.connection.on('message send', this.OnMessageSend);
    }

    _close = async () => {
        this.sdk.connection.off('welcome', this.OnWelcome);
        this.sdk.off(SdkEvents.Security.LoginSuccess, this.OnLoginSuccess);
        this.sdk.connection.off('message send', this.OnMessageSend);
    }

    set connected(fn: () => void) { this.sdk.connection.on('connect', fn); }
    set disconnected(fn: (reason: string) => void) { this.sdk.connection.on('disconnect', fn); }
    set reconnectAttempted(fn: (attempt: number) => void) { this.sdk.connection.on('reconnect_attempt', fn); }
    set reconnected(fn: (attempt: number) => void) { this.sdk.connection.on('reconnect', fn); }
    set welcome(fn: (data: any) => void) { this.sdk.connection.on('welcome', fn); }

    set loginSuccess(fn: (user: any) => void) { this.sdk.on(SdkEvents.Security.LoginSuccess, fn); }
    set loginFailed(fn: (reason: any) => void) { this.sdk.on(SdkEvents.Security.LoginFailed, fn); }
    set logoutSuccess(fn: () => void) { this.sdk.on(SdkEvents.Security.LogoutSuccess, fn); }
    set logoutFailed(fn: () => void) { this.sdk.on(SdkEvents.Security.LogoutFailed, fn); }

    set messageReceived(fn: (message: any) => void) { this.sdk.on(SdkEvents.Message.Received, fn); }

    set subscriberOwnered(fn: (subscriber: number, instigator: number, group: number) => void) { this.sdk.on(SdkEvents.Group.Action.Owner, fn); };
    set subscriberAdmined(fn: (subscriber: number, instigator: number, group: number) => void) { this.sdk.on(SdkEvents.Group.Action.Admin, fn); };
    set subscriberModded(fn: (subscriber: number, instigator: number, group: number) => void) { this.sdk.on(SdkEvents.Group.Action.Mod, fn); };
    set subscriberReset(fn: (subscriber: number, instigator: number, group: number) => void) { this.sdk.on(SdkEvents.Group.Action.Reset, fn);};
    set subscriberSilenced(fn: (subscriber: number, instigator: number, group: number) => void) { this.sdk.on(SdkEvents.Group.Action.Silence, fn); };
    set subscriberKicked(fn: (subscriber: number, instigator: number, group: number) => void) { this.sdk.on(SdkEvents.Group.Action.Kick, fn); };
    set subscriberBanned(fn: (subscriber: number, instigator: number, group: number) => void) { this.sdk.on(SdkEvents.Group.Action.Ban, fn); };
    set subscriberJoined(fn: (subscriber: number, group: number) => void) { this.sdk.on(SdkEvents.Group.Action.Join, fn); };
    set subscriberLeft(fn: (subscriber: number, group: number) => void) { this.sdk.on(SdkEvents.Group.Action.Leave, fn); };

    private OnWelcome = async (data) => {
        if (!data.loggedInUser) return;
        this.sdk.emit(SdkEvents.Security.LoginSuccess, data.loggedInUser);
    }

    private OnLoginSuccess = async (user) => {
        this.sdk.currentSubscriber = user;

        await this.sdk.message.groupSubscribe();
        await this.sdk.message.privateSubscribe();
    }

    private OnMessageSend = async (data) => {
        const { mimeType } = data.body;

        switch (mimeType) {
            case MessageType.TextHtml:
            case MessageType.TextVoice:
            case MessageType.TextImage:
            case MessageType.TextPlain:
                return this.sdk.emit(SdkEvents.Message.Received, { 
                    ...data.body, 
                    recipient: data.body.recipient.id ?? data.body.recipiet, 
                    originator: data.body.originator.id ?? data.body.originator,
                    text: data.body.data.toString('utf8') 
                });
            case MessageType.GroupAction:
                return this.OnGroupActionMessage(data);
            default:
                return Promise.resolve();
        }
    }

    private OnGroupActionMessage = async (data) => {
        let { recipient, originator, data: buff } = data.body;
        recipient = recipient.id ?? recipient;
        originator = originator.id ?? originator;
        let { instigatorId, type } = JSON.parse(buff.toString('utf8'));

        switch (type) {
            case 'join':
                return this.sdk.emit(SdkEvents.Group.Action.Join, recipient, originator);
            case 'leave': {
                if (instigatorId) return this.sdk.emit(SdkEvents.Group.Action.Kick, recipient, instigatorId, originator);
                else return this.sdk.emit(SdkEvents.Group.Action.Leave, recipient, originator);
            }
            case 'owner':
                return this.sdk.emit(SdkEvents.Group.Action.Owner, recipient, instigatorId, originator);
            case 'admin':
                return this.sdk.emit(SdkEvents.Group.Action.Admin, recipient, instigatorId, originator);
            case 'mod':
                return this.sdk.emit(SdkEvents.Group.Action.Mod, recipient, instigatorId, originator);
            case 'reset':
                return this.sdk.emit(SdkEvents.Group.Action.Reset, recipient, instigatorId, originator);
            case 'silence':
                return this.sdk.emit(SdkEvents.Group.Action.Silence, recipient, instigatorId, originator);
            case 'ban':
                return this.sdk.emit(SdkEvents.Group.Action.Ban, recipient, instigatorId, originator);
            default:
                return false;
        }
    }
}