import { Request } from 'express';
import { Numbers } from './Command';

export enum MessageFromType {
  'group' = 'group',
  'anonymous' = 'anonymous',
  'user' = 'user',
  'unhandled' = 'unhandled',
}
export function getMessageFromTypeFromRequest(req: Request): MessageFromType {
  const { message_type, sub_type } = req.body;
  if (message_type === 'group' && sub_type === 'normal') return MessageFromType.group;
  if (message_type === 'group' && sub_type === 'anonymous') return MessageFromType.anonymous;
  if (message_type === 'private' && sub_type === 'friend') return MessageFromType.user;
  return MessageFromType.unhandled;
}

export function getMessageFromTypeFromNumbers({ fromUser, fromGroup, robot }: Numbers): MessageFromType {
  if (fromGroup && fromUser) return MessageFromType.group;
  if (fromGroup && !fromUser) return MessageFromType.anonymous;
  if (!fromGroup && fromUser) return MessageFromType.user;
  return MessageFromType.unhandled;
}
