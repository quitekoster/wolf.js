import type SecurityToken from "./SecurityToken";
import type Subscriber from "./Subscriber";

export default interface SecurityLogin {
    cognito: SecurityToken;
    subscriber: Subscriber;
}