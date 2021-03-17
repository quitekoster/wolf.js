import type { SDK } from "../..";
import type IManeger from "../../Interfaces/iManager";
import IOCommands from "../../Types/IOCommands";

export default class MessageManager implements IManeger {
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
    
    groupSubscribe = async () => {
        try {
            await this.sdk.send(IOCommands.Message.GroupSubscribe, { headers: { version: 4 } });
            return true;
        } catch (e) {
            return false;
        }
    }
    
    privateSubscribe = async () => {
        try {
            await this.sdk.send(IOCommands.Message.PrivateSubscribe);
            return true;
        } catch (e) {
            return false;
        }
    }
}