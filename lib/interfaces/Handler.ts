import type SDK from "../SDK";

export default interface Handler {
    sdk: SDK;
    init: () => Promise<void>;
    close: () => Promise<void>;
}