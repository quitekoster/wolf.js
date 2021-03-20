export default interface Context {
    reply: (data: string | Buffer, mimeType?: string) => Promise<void>;
    replyPrivately: (data: string | Buffer, mimeType?: string) => Promise<void>;
}