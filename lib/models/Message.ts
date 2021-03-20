import type { MessageType } from "../enums/MessageType";

export default interface Message {
    id: string;
    recipient: number | { id: number, hash: string };
    originator: number | { id: number, hash: string };
    isGroup: boolean;
    timestamp: Date;
    mimeType: MessageType;
}