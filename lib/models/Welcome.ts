import type Subscriber from "./Subscriber";

export default interface Welcome {
    ip: string;
    country: string;
    token: string;
    endpointConfig: {
        avatarEndpoint: string;
        mmsUploadEndpoint: string;
    }
    loggedInUser?: Subscriber
}