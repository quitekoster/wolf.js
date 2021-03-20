import SdkEvents from "./constants/SdkEvents";
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
    }

    private onTokenRefresh = async (token: SecurityToken) => {
        this.sdk.securityToken = token;
    }
}