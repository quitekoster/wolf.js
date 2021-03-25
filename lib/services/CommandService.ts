import SdkEvents from "../constants/SdkEvents";
import { MessageType } from "../enums/MessageType";
import type CommandContext from "../interfaces/CommandContext";
import type Handler from "../interfaces/Handler";
import type Message from "../models/Message";
import type SDK from "../SDK";

export default class CommandService implements Handler {
    sdk: SDK;
    private stack: { [key: string]: ((sdk: SDK, context: CommandContext, next: () => Promise<void>) => Promise<void>)[] } = {};

    constructor(sdk: SDK) {
        this.sdk = sdk;
    }

    init = async () => {
        this.sdk.on(SdkEvents.Message.Received, this.onMessage);
    }

    close = async () => {
        this.sdk.off(SdkEvents.Message.Received, this.onMessage);
    }

    get Triggers() { return Object.keys(this.stack); };

    command = (trigger: string, ...fns: ((sdk: SDK, context: CommandContext, next: () => Promise<void>) => Promise<void>)[]) => this.stack[trigger] = fns; 

    private nextMessage = (originator: number, recipient: number, timeout: number = 120) => new Promise<{ sender: number, message: string }>((resolve, reject) => {
        let onMessage = async (message: Message) => {
            let { originator: orig, recipient: recip, data } = message;
            orig = orig['id'] ?? orig;
            recip = recip['id'] ?? recip;

            // Always ignore the client's messages
            if (orig === this.sdk.loggedInUser?.id) return;

            if (!(originator === 0 || originator === orig) && recip === recipient) return;
            resolve({
                sender: orig['id'] ?? orig,
                message: data.toString('utf-8')
            });
            clearTimeout(to);
            this.sdk.off(SdkEvents.Message.Received, onMessage);
        };

        let to = setTimeout(() => {
            reject();
            this.sdk.off(SdkEvents.Message.Received, onMessage);
        }, timeout * 1000);

        this.sdk.on(SdkEvents.Message.Received, onMessage);
    });

    private onMessage = async (message: Message) => {
        const { originator, recipient, isGroup, data, mimeType } = message;

        if (mimeType !== MessageType.TextPlain) return;

        let text = data.toString('utf8');

        let cmd = Object.keys(this.stack).sort((a, b) => b.length - a.length).find(cmd => text.toLowerCase().startsWith(cmd.toLowerCase()));

        if (cmd === undefined) return;

        let stack = this.stack[cmd];
        let stackIndex = 0;

        let recip = recipient['id'] ?? recipient;
        let orig = originator['id'] ?? originator;

        let context: CommandContext = {
            message,
            rest: text.replace(cmd, '').trimStart(),
            triggers: Object.keys(this.stack).map(t => t.toLowerCase().trim()),
            reply: async (data: string | Buffer, mimeType: MessageType | undefined = MessageType.TextPlain) => await this.sdk.message.send(isGroup ? recip : orig, isGroup, data, mimeType),
            replyPrivately: async (data: string | Buffer, mimeType: MessageType | undefined = MessageType.TextPlain) => await this.sdk.message.send(orig, false, data, mimeType),
            nextGroupMessage: async (timeout: number = 120) => await this.nextMessage(0, recip, timeout),
            nextSubscriberMessage: async (timeout: number = 120) => (await this.nextMessage(orig, recip, timeout)).message
        }

        try {
            let next = async (): Promise<void> => {
                await stack[stackIndex++](this.sdk, context, next);
            }

            next();
        } catch (e) { console.log(e); }
    }
}