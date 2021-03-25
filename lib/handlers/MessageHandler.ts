import IOCommands from "../constants/IOCommands";
import type Handler from "../interfaces/Handler";
import type SDK from "../SDK";
import type Message from '../models/Message';
import { MessageType } from "../enums/MessageType";
import { v4 } from 'uuid'

export default class MessageHandler implements Handler {
    sdk: SDK;

    constructor(sdk: SDK) {
        this.sdk = sdk;
    }

    init = async () => {

    }

    close = async () => {

    }

    groupSubscribe = async (): Promise<boolean> => {
        try {
            await this.sdk.send(IOCommands.Message.GroupSubscribe, { headers: { version: 4 } });
            return true;
        } catch (e) {
            return false;
        }
    }

    privateSubscribe = async (): Promise<boolean> => {
        try {
            await this.sdk.send(IOCommands.Message.PrivateSubscribe);
            return true;
        } catch (e) {
            return false;
        }
    }

    send = async (recipient: number, isGroup: boolean, data: string | Buffer, mimeType: MessageType = MessageType.TextPlain): Promise<boolean> => {
        try {
            await this.sdk.send(IOCommands.Message.Send, {
                recipient,
                isGroup,
                data,
                mimeType,
                flightId: v4()
            });
            return true;
        } catch (e) {
            return false;
        }
    }
}