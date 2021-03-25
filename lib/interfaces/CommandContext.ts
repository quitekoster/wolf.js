import type { MessageType } from "../enums/MessageType";
import type Message from "../models/Message";

export default interface CommandContext {
    [key: string]: any;
    message: Message;
    reply: (data: string | Buffer, mimeType?: MessageType) => Promise<boolean>;
    replyPrivately: (data: string | Buffer, mimeType?: MessageType) => Promise<boolean>;
    nextSubscriberMessage: (timeout?: number) => Promise<string>;
    nextGroupMessage: (timeout?: number) => Promise<{ sender: number, message: string}>;
    triggers: string[],
    rest: string;
}