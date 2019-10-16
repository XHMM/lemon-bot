import { Messages } from './CQHelper';
import { HttpPlugin } from './HttpPlugin';
export declare enum Scope {
    user = "user",
    group = "group",
    both = "both"
}
export declare enum TriggerType {
    at = "at",
    noAt = "noAt",
    both = "both"
}
export interface Numbers {
    fromUser: number | null;
    fromGroup: number | undefined;
    robot: number;
}
interface BaseParams extends Numbers {
    messages: Messages;
    stringMessages: string;
}
export interface ParseParams extends BaseParams {
}
export declare type ParseReturn = any;
declare type SetNextFn = (sessionName: string, expireSeconds?: number) => Promise<void>;
declare type SetEndFn = () => Promise<void>;
export interface UserHandlerParams extends BaseParams {
    fromUser: number;
    fromGroup: undefined;
    setNext: SetNextFn;
}
export interface GroupHandlerParams extends BaseParams {
    fromGroup: number;
    isAt: boolean;
    setNext: SetNextFn;
}
export interface SessionHandlerParams extends BaseParams {
    setNext: SetNextFn;
    setEnd: SetEndFn;
    historyMessages: Record<string, Messages>;
}
export declare type HandlerReturn = {
    atSender: boolean;
    content: string;
} | string[] | string | void;
declare type OrPromise<T> = T | Promise<T>;
export declare abstract class Command<C = unknown, D = unknown> {
    scope: Scope;
    directives: string[];
    context: C;
    httpPlugin: HttpPlugin;
    includeGroup?: number[];
    excludeGroup?: number[];
    includeUser?: number[];
    excludeUser?: number[];
    triggerType?: TriggerType;
    data: D;
    constructor();
    static normalizeDirectives(cmd: Command): void;
    directive?(): string[];
    parse?(params: ParseParams): OrPromise<ParseReturn>;
    user?(params: UserHandlerParams): OrPromise<HandlerReturn>;
    group?(params: GroupHandlerParams): OrPromise<HandlerReturn>;
}
export declare function include(include: number[]): (proto: any, name: any, descriptor: any) => void;
export declare function exclude(exclude: number[]): (proto: any, name: any, descriptor: any) => void;
export declare function trigger(type: TriggerType): (proto: any, name: any, descriptor: any) => void;
export {};
