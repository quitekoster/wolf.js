export default interface EmitData {
    headers?: {
        version: 1 | 2 | 3 | 4;
        [key: string]: string | number | boolean | object;
    },
    body?: {
        [key: string]: string | number | boolean | object | EmitData | undefined;
    },
    [key: string]: string | number | boolean | object | EmitData | undefined;
}