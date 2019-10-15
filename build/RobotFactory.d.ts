import { Command } from './Command';
import { HttpPlugin } from './HttpPlugin';
import { Session } from './Session';
interface CreateParams {
    port: number;
    robot: number;
    httpPlugin: HttpPlugin;
    commands: Command[];
    session?: Session | null;
    secret?: string;
    context?: Record<string, any> | null;
}
interface CreateReturn {
    start(): Promise<void>;
    stop(): void;
}
export declare class RobotFactory {
    private static commandsMap;
    private static appsMap;
    static create({ port, robot, httpPlugin, commands, session, secret, context }: CreateParams): CreateReturn;
}
export {};
