import IOCommands from "../constants/IOCommands";
import SdkEvents from "../constants/SdkEvents";
import type Handler from "../interfaces/Handler";
import type SecurityLogin from "../models/SecurityLogin";
import type SecurityToken from "../models/SecurityToken";
import type Subscriber from "../models/Subscriber";
import type SDK from "../SDK";
const md5 = require('blueimp-md5');

export default class SecurityHandler implements Handler {
    sdk: SDK;

    constructor(sdk: SDK) {
        this.sdk = sdk;
    }

    init = async () => {

    }

    close = async () => {

    }

    login = async (username: string, password: string): Promise<boolean> => {
        try {
            let res = <SecurityLogin>(await this.sdk.send(IOCommands.Security.Login, {
                headers: { version: 2 },
                body: {
                    username,
                    password: md5(password),
                    md5Password: true,
                    type: 'email'
                }
            }));

            let { cognito, subscriber } = res;
            this.sdk.emit(SdkEvents.Security.TokenRefreshed, cognito);
            this.sdk.emit(SdkEvents.Security.LoginSuccess, subscriber);
            return true;
        } catch (e) {
            this.sdk.emit(SdkEvents.Security.LoginFailed, e);
            return false;
        }
    }

    logout = async (): Promise<boolean> => {
        try {
            await this.sdk.send(IOCommands.Security.Logout);
            this.sdk.emit(SdkEvents.Security.LogoutSuccess);
            return true;
        } catch (e) {
            this.sdk.emit(SdkEvents.Security.LogoutFailed, e);
            return false;
        }
    }

    tokenRefresh = async (): Promise<SecurityToken> => {
        try {
            let token: SecurityToken = <SecurityToken>(await this.sdk.send(IOCommands.Security.TokenRefresh))
            this.sdk.emit(SdkEvents.Security.TokenRefreshed, token);
            return token;
        } catch (e) {
            return { token: '', identity: '' }
        }
    }
}