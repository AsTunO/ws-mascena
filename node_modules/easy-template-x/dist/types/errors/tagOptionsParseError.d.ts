export declare class TagOptionsParseError extends Error {
    readonly tagRawText: string;
    readonly parseError: Error;
    constructor(tagRawText: string, parseError: Error);
}
