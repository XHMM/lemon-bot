export declare class Logger {
    private static prefix;
    private static debugLogger;
    private static logger;
    static setDebugLabel(label: string): void;
    static clearDebugLabel(label: string): void;
    static enableDebug(): void;
    static disableDebug(): void;
    static debug(...msg: any[]): void;
    static warn(...msg: any[]): void;
    static error(...msg: any[]): void;
}
