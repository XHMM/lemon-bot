/* eslint-disable @typescript-eslint/unbound-method */
import { assertType, type } from '@xhmm/utils';
import { Message, CQMessageFromTypeHelper } from './CQHelper';
import { HttpPlugin } from './HttpPlugin';
import { HistoryMessage } from './Session';
import { warn } from './logger';

type OrPromise<T> = T | Promise<T>;

// 命令生效范围
export enum Scope {
  user = 'user', // 仅在和机器人私聊时刻触发该命令
  group = 'group', // 仅在群组内发消息时刻触发该命令
  both = 'both', // 私聊和群内都可触发该命令
}

// 群组内时命令触发方式
export enum TriggerType {
  at = 'at', // at表示需要艾特机器人并输入内容方可触发
  noAt = 'noAt', //noAt表示需要直接输入内容不能艾特
  both = 'both', // both表示两种皆可
}

// 群组内什么身份可触发
export enum TriggerScope {
  'all' = 0b111, // 所有人
  'owner' = 0b100, // 群主
  'admin' = 0b010, // 管理员
  'member' = 0b01, // 普通群员
}

export enum MessageFromType {
  'userFriend' = 'userFriend',
  'userGroup' = 'userGroup',
  'userOther' = 'userOther', // cqhttp文档有个这类型，but not clear what exactly it is

  'qqGroupNormal' = 'qqGroupNormal',
  'qqGroupAnonymous' = 'qqGroupAnonymous',

  'unknown' = 'unknown',
}

// 每个上报请求都可用下述字段来唯一标识
export interface RequestIdentity {
  robot: number;
  messageFromType: MessageFromType;
  fromUser: number | AnonymousUser;
  fromGroup: number | undefined;
}

export interface AnonymousUser {
  id: number;
  name: string;
  flag: string; // 这个字段每次发消息都是会变的，在生成session key时须对其移除
}

export interface UserMessageInfo extends RequestIdentity {
  messageFromType:
    | MessageFromType.userFriend
    | MessageFromType.userGroup
    | MessageFromType.userOther;
  fromUser: number;
  fromGroup: undefined;
}
export interface QQGroupNormalMessageInfo extends RequestIdentity {
  messageFromType: MessageFromType.qqGroupNormal;
  fromUser: number;
  fromGroup: number;
}
export interface QQGroupAnonymousMessageInfo extends RequestIdentity {
  messageFromType: MessageFromType.qqGroupAnonymous;
  fromUser: AnonymousUser;
  fromGroup: number;
}


//// 类特殊函数
interface BaseParams {
  message: Message[];
  rawMessage: string;
  requestBody: any;
}

// parse函数
export interface ParseParams extends BaseParams, RequestIdentity {}

// 用于设置session name和过期时间
type SetNextFn = (sessionFunctionName: string, expireSeconds?: number) => Promise<void>;
// 用于删除session
type SetEndFn = () => Promise<void>;
interface HandlerBaseParams extends BaseParams {
  setNext: SetNextFn;
}
// user函数
export interface UserHandlerParams<D = unknown> extends HandlerBaseParams, UserMessageInfo {
  data: D;
}

// group函数
interface GroupHandlerBaseParams<D = unknown> extends HandlerBaseParams {
  isAt: boolean;
  data: D;
}
export type GroupHandlerParams<D = unknown> = GroupHandlerBaseParams<D> &
  (QQGroupAnonymousMessageInfo | QQGroupNormalMessageInfo);

// both函数
export interface BothHandlerParams<D = unknown> extends HandlerBaseParams, RequestIdentity {
  data: D;
}

// session函数
export interface SessionHandlerParams extends HandlerBaseParams {
  setEnd: SetEndFn;
  historyMessage: HistoryMessage;
}

type HandlerParams = UserHandlerParams | GroupHandlerParams | BothHandlerParams;
// return
export type HandlerReturn =
  | {
      atSender: boolean;
      content: string;
    }
  | string[]
  | string
  | void;

export type ParseReturn = any;
export type UserHandlerReturn = HandlerReturn;
export type GroupHandlerReturn = HandlerReturn;
export type BothHandlerReturn = HandlerReturn;
export type SessionHandlerReturn = HandlerReturn;
//// 类特殊函数END

export abstract class Command<C = unknown, D = unknown> {
  context: C; // 值为create时传入的内容
  httpPlugin: HttpPlugin; // 值为create时传入的内容

  private _scope: Scope; // 该命令的作用域
  private _directives: string[]; // 该命令的指令名称

  private _includeGroup: number[] = []; // @include
  private _excludeGroup: number[] = []; // @exclude
  private _includeUser: number[] = []; // @include
  private _excludeUser: number[] = []; // @exclude
  private _triggerType: TriggerType = TriggerType.at; // @trigger
  private _triggerScope: TriggerScope = TriggerScope.all; // @scope

  constructor() {
    if (this.directive) assertType(this.directive, 'function');
    if (this.parse) assertType(this.parse, 'function');
    if (!this.directive && !this.parse) throw new Error('必须为Command类提供directive函数或parse函数');

    const hasUserHandler = type(this.user) === 'function';
    const hasGroupHandler = type(this.group) === 'function';
    const hasBothHandler = type(this.both) === 'function';
    if (hasBothHandler) this._scope = Scope.both;
    else if (hasGroupHandler && hasUserHandler) this._scope = Scope.both;
    else {
      if (!hasUserHandler && !hasGroupHandler) throw new Error('必须为Command类提供user函数或group函数或both函数');
      if (hasGroupHandler) this._scope = Scope.group;
      if (hasUserHandler) this._scope = Scope.user;
    }

    const defaultDirective = new.target.name + 'Default';
    if (type(this.directive) === 'function') {
      const directives = this.directive!();
      if (type(directives) === 'array' || directives.length !== 0) {
        this._directives = directives;
        return;
      } else this._directives = [defaultDirective];
    } else this._directives = [defaultDirective];
  }


  get scope(): Scope {
    return this._scope;
  }
  get directives(): string[] {
    return this._directives;
  }

  get excludeGroup(): number[] {
    return this._excludeGroup;
  }
  get includeGroup(): number[] {
    return this._includeGroup;
  }
  get includeUser(): number[] {
    return this._includeUser;
  }
  get excludeUser(): number[] {
    return this._excludeUser;
  }
  get triggerType(): TriggerType {
    return this._triggerType;
  }
  get triggerScope(): TriggerScope {
    return this._triggerScope;
  }

  directive?(): string[];
  parse?(params: ParseParams): OrPromise<ParseReturn>;

  user?(params: UserHandlerParams<D>): OrPromise<HandlerReturn>;
  group?(params: GroupHandlerParams<D>): OrPromise<HandlerReturn>;
  both?(params: BothHandlerParams<D>): OrPromise<HandlerReturn>;
}

//// 修饰器
/**
 * @description 用于user和group函数。指定该选项时，只有这里面的qq/qq群可触发该命令
 * @param include qq/qq群号
 */
export function include(include: number[]) {
  return function(proto, name) {
    if (name === 'group') {
      if ('_excludeGroup' in proto) throw new Error('@exclude and @include cannot used at the same time');
      proto._includeGroup = include;
    } else if (name === 'user') {
      if ('_excludeUser' in proto) throw new Error('@exclude and @include cannot used at the same time');
      proto._includeUser = include;
    } else warn('@include only works on user or group function');
  };
}

/**
 * @description 用于user和group函数。指定该选项时，这里面的qq/qq群不可触发该命令。
 * @param exclude qq/qq群号
 */
export function exclude(exclude: number[]) {
  return function(proto, name, descriptor) {
    if (name === 'group') {
      if ('_includeGroup' in proto) throw new Error('@exclude and @include cannot used at the same time');
      proto._excludeGroup = exclude;
    } else if (name === 'user') {
      if ('_includeUser' in proto) throw new Error('@exclude and @include cannot used at the same time');
      proto._excludeUser = exclude;
    } else console.warn('@exclude only works on user or group function');
  };
}

/**
 * @description 用于group和both函数。设置群组内命令触发方式
 * @param type 触发方式
 */
export function trigger(type: TriggerType) {
  return function(proto, name) {
    if (name !== 'group' && name !== 'both') {
      warn('@trigger only works on group or both function');
    } else proto._triggerType = type;
  };
}

/**
 * @description 用于group和both函数。设置群组内什么身份可触发命令
 * @param role 群员身份
 */
export function scope(role: TriggerScope) {
  return function(proto, name, descriptor) {
    if (name !== 'group' && name !== 'both') {
      warn('@trigger only works on group or both function');
    } else proto._triggerScope = role;
  };
}
//// 修饰器END

//// type guard
// 用户消息
export function fromUserMessage(p: HandlerParams): p is UserHandlerParams {
  return CQMessageFromTypeHelper.isUserMessage(p.messageFromType);
}
// q群所有消息
export function fromQQGroupMessage(
  p: HandlerParams
): p is GroupHandlerBaseParams & (QQGroupNormalMessageInfo | QQGroupAnonymousMessageInfo) {
  return CQMessageFromTypeHelper.isQQGroupMessage(p.messageFromType);
}
// q群普通消息
export function fromQQGroupNormalMessage(p: HandlerParams): p is GroupHandlerBaseParams & QQGroupNormalMessageInfo {
  return CQMessageFromTypeHelper.isQQGroupNormalMessage(p.messageFromType);
}
// q群匿名消息
export function fromQQGroupAnonymousMessage(
  p: HandlerParams
): p is GroupHandlerBaseParams & QQGroupAnonymousMessageInfo {
  return CQMessageFromTypeHelper.isQQGroupAnonymousMessage(p.messageFromType);
}
//// type guard END
