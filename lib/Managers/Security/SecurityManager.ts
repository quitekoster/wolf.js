import type { SDK } from "../..";
import type IManeger from "../../Interfaces/iManager";
import IOCommands from "../../Types/IOCommands";
import SdkEvents from "../../Types/SdkEvents";

export default class SecurityManager implements IManeger {
    sdk: SDK;

    constructor(sdk: SDK) {
        this.sdk = sdk;
    }

    _init = async () => {
        return Promise.resolve();
    }

    _close = async () => {
        return Promise.resolve();
    }

    login = async (username: string, password: string) => {
        try {
            let res = await this.sdk.send(IOCommands.Security.Login, {
                headers: { version: 4 },
                body: { username, password }
            });
            this.sdk.emit(SdkEvents.Security.LoginSuccess, res);
            return true;
        } catch (e) {
            this.sdk.emit(SdkEvents.Security.LoginFailed, e);
            return false;
        }
    }

    logout = async () => {
        try {
            await this.sdk.send(IOCommands.Security.Logout);
            this.sdk.emit(SdkEvents.Security.LogoutSuccess);
            return true;
        } catch (e) {
            this.sdk.emit(SdkEvents.Security.LogoutFailed, e);
            return false;
        }
    }
}