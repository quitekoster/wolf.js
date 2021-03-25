import SdkEvents from "./constants/SdkEvents";
import { MessageType } from "./enums/MessageType";
import type Message from "./models/Message";
import type SecurityToken from "./models/SecurityToken";
import type Subscriber from "./models/Subscriber";
import type Welcome from "./models/Welcome";
import type SDK from "./SDK";

export default class Events {
    private sdk: SDK;

    constructor(sdk: SDK) {
        this.sdk = sdk;
    }

    init = async () => {
        this.disconnected = this.onDisconnected;
        this.welcomed = this.onWelcome;
        this.loginSuccess = this.onLoginSuccess;
        this.logoutSuccess = this.onLogoutSuccess;
        this.sdk.on(SdkEvents.Security.TokenRefreshed, this.onTokenRefresh);
        this.sdk.connection.on('message send', this.onMessage);
    }

    set connected(fn: () => Promise<void>) { this.sdk.connection.on('connect', fn); }
    set disconnected(fn: (reason: string) => Promise<void>) { this.sdk.connection.on('disconnect', fn); }
    set reconnected(fn: (attempt: number) => Promise<void>) { this.sdk.connection.on('reconnect', fn); }
    set pinged(fn: () => Promise<void>) { this.sdk.connection.on('ping', fn); }
    set ponged(fn: (latency: number) => Promise<void>) { this.sdk.connection.on('pong', fn); }

    set welcomed(fn: (data: Welcome) => Promise<void>) { this.sdk.connection.on('welcome', fn); }

    set loginSuccess(fn: (user: Subscriber) => Promise<void>) { this.sdk.on(SdkEvents.Security.LoginSuccess, fn); }
    set loginFailed(fn: () => Promise<void>) { this.sdk.on(SdkEvents.Security.LoginFailed, fn); }
    set logoutSuccess(fn: () => Promise<void>) { this.sdk.on(SdkEvents.Security.LogoutSuccess, fn); }
    set logoutFailed(fn: () => Promise<void>) { this.sdk.on(SdkEvents.Security.LogoutFailed, fn); }

    set groupMemberJoin(fn: (subscriberId: number, groupId: number) => Promise<void>) { this.sdk.on(SdkEvents.Group.MemberJoined, fn); }
    set groupMemberLeave(fn: (subscriberId: number, groupId: number) => Promise<void>) { this.sdk.on(SdkEvents.Group.MemberLeft, fn); }
    set groupMemberUpdated(fn: (subscriberId: number, instigatorId: number, groupId: number, action: 'owner' | 'admin' | 'mod' | 'reset' | 'silence' | 'kick' | 'ban') => Promise<void>) { this.sdk.on(SdkEvents.Group.MemberUpdate, fn); }

    set messageReceived(fn: (message: Message) => Promise<void>) { this.sdk.on(SdkEvents.Message.Received, fn); }

    private onDisconnected = async () => {
        // Invalidate the Token
        this.sdk.securityToken.token = '';
        this.sdk.securityToken.identity = '';

        // Invalidate the mmsUploadEndpoint
        this.sdk.mmsUploadEndpoint = '';

        // Invalidate the LoggedInUser
        this.sdk.loggedInUser = undefined;
    }

    private onWelcome = async (data: Welcome) => {
        const { ip, country, token, endpointConfig: { avatarEndpoint, mmsUploadEndpoint }, loggedInUser } = data;

        this.sdk.ip = ip;
        this.sdk.country = country;
        this.sdk.token = token;
        this.sdk.avatarEndpoint = avatarEndpoint;
        this.sdk.mmsUploadEndpoint = mmsUploadEndpoint;

        if (!loggedInUser) return;

        this.sdk.emit(SdkEvents.Security.LoginSuccess, loggedInUser);
    }

    private onLogoutSuccess = async () => {
        // Invalidate the Token
        this.sdk.securityToken.token = '';
        this.sdk.securityToken.identity = '';

        // Invalidate the mmsUploadEndpoint
        this.sdk.mmsUploadEndpoint = '';

        // Invalidate the LoggedInUser
        this.sdk.loggedInUser = undefined;
    }

    private onLoginSuccess = async (user: Subscriber) => {
        this.sdk.loggedInUser = user;

        // Grab Security Tokens for MMS Upload if needed
        if (this.sdk.securityToken.identity === '' || this.sdk.securityToken.token === '')
            await this.sdk.security.tokenRefresh();

        // Subscribe to Messages
        await this.sdk.message.groupSubscribe();
        await this.sdk.message.privateSubscribe();
    }

    private onTokenRefresh = async (token: SecurityToken) => {
        this.sdk.securityToken = token;
    }

    private onMessage = async (data: { code: number, body: Message }) => {
        switch (data.body.mimeType) {
            case MessageType.GroupAction:
                return await this.onGroupAction(data);
            default:
                return this.sdk.emit(SdkEvents.Message.Received, data.body);
        }
    }

    private onGroupAction = async (data: { code: number, body: Message }) => {
        const { originator, recipient, data: bodyData } = data.body;

        const action = <{ 
            instigatorId: number, 
            action: 'owner' | 'admin' | 'mod' | 'reset' | 'silence' | 'ban' | 'join' | 'leave';
        }>JSON.parse(bodyData.toString('utf-8'));

        let recp = recipient['id'] ?? recipient;
        let grp = originator['id'] ?? originator;
        let inst = action.instigatorId;

        switch (action.action) {
            case 'owner':
            case 'admin':
            case 'mod':
            case 'reset':
            case 'silence':
            case 'ban':
                return this.sdk.emit(SdkEvents.Group.MemberUpdate, recp, inst, grp, action.action);
            case 'join':
                return this.sdk.emit(SdkEvents.Group.MemberJoined, recp, grp);
            case 'leave': {
                if (inst === undefined)
                    return this.sdk.emit(SdkEvents.Group.MemberLeft, recp, grp);
                return this.sdk.emit(SdkEvents.Group.MemberUpdate, recp, inst, grp, 'kick');
            }
        }
    }
}