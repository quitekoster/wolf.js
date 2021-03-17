import type { SDK } from ".";
import SdkEvents from "./Types/SdkEvents";

export default class Events {
    private sdk: SDK;

    constructor(sdk: SDK) { 
        this.sdk = sdk;
    }

    _init = async () => {
        this.welcome = this.OnWelcome;
        this.loginSuccess = this.OnLoginSuccess;
    }

    _close = async () => {
        this.sdk.connection.off('welcome', this.OnWelcome);
        this.sdk.off(SdkEvents.Security.LoginSuccess, this.OnLoginSuccess);
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

    private OnWelcome = async (data) => {
        if (!data.loggedInUser) return;
        this.sdk.emit(SdkEvents.Security.LoginSuccess, data.loggedInUser);
    }

    private OnLoginSuccess = async (user) => {
        this.sdk.currentSubscriber = user;

        await this.sdk.message.groupSubscribe();
        await this.sdk.message.privateSubscribe();
    }
}