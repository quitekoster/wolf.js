export default interface Subscriber {
    id: number;
    hash: string;
    privileges: number;
    nickname: string;
    status: string;
    reputation: number;
    icon?: number;
    onlineState: number;
    deviceType: number;
    charms: object;
    email?: string;
}