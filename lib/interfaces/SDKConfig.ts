export default interface SDKConfig {
    uri: 'wss://v3.palringo.com' | 'wss://v3-rc.palringo.com';
    token: string;
    device: 'web' | 'android' | 'ios';
    onlineState: 0 | 1;
    cacheEntities: boolean
};