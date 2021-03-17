import type { SDK } from "..";

export default interface IManeger {
    sdk: SDK;
    _init: () => Promise<any>;
    _close: () => Promise<any>;
}