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
    extended?: {
        language?: number;
        urls?: string[];
        lookingFor?: number;
        dateOfBirth?: string;
        relationship?: number;
        gender?: number;
        about?: string;
        relationshipStatus?: number;
        sex?: number;
        name?: string;
    }
}