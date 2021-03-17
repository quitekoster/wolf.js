import { DeviceType } from "../Types/DeviceType";
import { SubscriberPresence } from "../Types/SubscriberPresence";
import { v4 } from 'uuid';

export interface iConfig {
    deauthToken: boolean;
    device: 'ios' | 'android' | 'web';
    onlineState: SubscriberPresence;
    token: string;
    uri: 'wss://v3.palringo.com' | 'wss://v3-rc.palringo.com';
}

export const DefaultConfig: iConfig = {
    deauthToken: true,
    device: 'web',
    onlineState: SubscriberPresence.Online,
    token: v4(),
    uri: 'wss://v3-rc.palringo.com'
};