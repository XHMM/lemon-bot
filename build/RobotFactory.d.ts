import { Command } from './Command';
import { HttpPlugin } from './HttpPlugin';
import { Session } from './Session';
interface CreateParams<C = unknown> {
    port: number;
    robot: number;
    httpPlugin: HttpPlugin;
    commands: Command[];
    session?: Session | null;
    secret?: string;
    context?: C;
}
interface CreateReturn {
    start(): Promise<void>;
    stop(): void;
}
export declare class RobotFactory {
    private static commandsMap;
    private static appsMap;
    static create<C>({ port, robot, httpPlugin, commands, session, secret, context }: CreateParams<C>): CreateReturn;
}
export {};
