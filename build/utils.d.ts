import { Request } from 'express';
import { Numbers } from './Command';
export declare enum MessageFromType {
    'group' = "group",
    'anonymous' = "anonymous",
    'user' = "user",
    'unhandled' = "unhandled"
}
export declare function getMessageFromTypeFromRequest(req: Request): MessageFromType;
export declare function getMessageFromTypeFromNumbers({ fromUser, fromGroup, robot }: Numbers): MessageFromType;
