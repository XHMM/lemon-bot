/* eslint-disable @typescript-eslint/unbound-method */
import { assertType, getType } from '@xhmm/utils';
import { Messages } from './CQHelper';
import { HttpPlugin } from './HttpPlugin';
import { MessageFromType } from './utils';
import { Logger } from './Logger';

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

// 常用的三种号码信息
export interface Numbers {
  fromUser: number | null; // 为null表明是匿名消息
  fromGroup: number | undefined; // 私聊时无群组信息，为undefined
  robot: number; // 机器人qq
}

interface BaseParams extends Numbers {
  messages: Messages;
  stringMessages: string;
}

// parse函数
export interface ParseParams extends BaseParams {}
export type ParseReturn = any;

type SetNextFn = (sessionName: string, expireSeconds?: number) => Promise<void>; // 设置session name和过期时间
type SetEndFn = () => Promise<void>; // 删除session

// user函数
export interface UserHandlerParams extends BaseParams {
  fromUser: number;
  fromGroup: undefined;
  setNext: SetNextFn;
}
// group函数
export interface GroupHandlerParams extends BaseParams {
  fromGroup: number;
  isAt: boolean;
  setNext: SetNextFn;
}
// both函数
export interface BothHandlerParams extends BaseParams {
  messageFromType: MessageFromType
  setNext: SetNextFn;
}
// session函数
export interface SessionHandlerParams extends BaseParams {
  setNext: SetNextFn;
  setEnd: SetEndFn;
  historyMessages: Record<string, Messages>; // { user/group/both: [..],  sessionName1: [..],  sessionName2: [..]}
}
export type HandlerReturn =
  | {
      atSender: boolean;
      content: string;
    }
  | string[]
  | string
  | void;

type OrPromise<T> = T | Promise<T>;

export abstract class Command<C = unknown, D = unknown> {
  // 下述属性是在node启动后被注入给了实例对象，之后不会再改变
  scope: Scope; // // [在该类构造函数内被注入] 使用该属性来判断该命令的作用域
  directives: string[]; // [在create阶段使用该类Command.normalizeDirectives函数被注入]
  context: C; // [在create阶段被注入] 值为create时传入的内容，默认为null
  httpPlugin: HttpPlugin; // [在create阶段被注入] 值为create时传入的内容

  includeGroup?: number[]; // 给group函数使用@include注入
  excludeGroup?: number[]; // 给group函数使用@exclude注入
  includeUser?: number[]; // 给user函数使用@include注入
  excludeUser?: number[]; // 给user函数使用@exclude注入
  triggerType?: TriggerType; // 给group/both使用@trigger进行设置，默认按at处理。请勿对其赋值，会导致修饰器无效！！！
  triggerScope?: TriggerScope;

  // 下述属性是在接收到http请求后被给实例对象，因此该值是动态变化的
  data: D; // [在请求处理中被注入] 值为parse函数的返回值，默认为null

  constructor() {
    if (this.directive) assertType(this.directive, 'function');
    if (this.parse) assertType(this.parse, 'function');
    if (!this.directive && !this.parse) throw new Error('请为Command的继承类提供directive函数或parse函数');
    const hasUserHandler = getType(this.user) === 'function';
    const hasGroupHandler = getType(this.group) === 'function';
    const hasBothHandler = getType(this.both) === 'function';

    if (hasBothHandler) this.scope = Scope.both;
    else if (hasGroupHandler && hasUserHandler) this.scope = Scope.both;
    else {
      if (!hasUserHandler && !hasGroupHandler) throw new Error('为Command的继承类提供user函数或group函数或both函数');
      if (hasGroupHandler) this.scope = Scope.group;
      if (hasUserHandler) this.scope = Scope.user;
    }
  }

  // must be called manually before using command
  public static normalizeDirectives(cmd: Command): void {
    const defaultDirective = cmd.constructor.name + 'Default';
    if (typeof cmd.directive === 'function') {
      const directives = cmd.directive();
      if (getType(directives) === 'array' || directives.length !== 0) {
        cmd.directives = directives;
        return;
      } else cmd.directives = [defaultDirective];
    } else cmd.directives = [defaultDirective];
  }

  directive?(): string[];
  parse?(params: ParseParams): OrPromise<ParseReturn>;

  user?(params: UserHandlerParams): OrPromise<HandlerReturn>;
  group?(params: GroupHandlerParams): OrPromise<HandlerReturn>;
  both?(params: BothHandlerParams): OrPromise<HandlerReturn>;

}

// 用于user和group。指定该选项时，只有这里面的qq/qq群可触发该命令
// TODO: 后期改为可接受(异步)函数
export function include(include: number[]) {
  return function(proto, name, descriptor) {
    if (name === 'group') {
      if ('excludeGroup' in proto)
        throw new Error("exclude and include decorators cannot used at the same time");
      proto.includeGroup = include;
    }
    else if (name === 'user') {
      if ('excludeUser' in proto)
        throw new Error("exclude and include decorators cannot used at the same time");
      proto.includeUser = include;
    }
    else
      Logger.warn("include decorator only works with user or group function")
  };
}

// 用于user和group。指定该选项时，这里面的qq/qq群不可触发该命令。
export function exclude(exclude: number[]) {
  return function(proto, name, descriptor) {
    if (name === 'group') {
      if ('includeGroup' in proto)
        throw new Error("exclude and include decorators cannot used at the same time");
      proto.excludeGroup = exclude;
    }
    else if (name === 'user') {
      if ('includeUser' in proto)
        throw new Error("exclude and include decorators cannot used at the same time");
      proto.excludeUser = exclude;
    }
    else
      Logger.warn("exclude decorator only works with user or group function")
  };
}

// 用于group和both。设置群组内命令触发方式
export function trigger(type: TriggerType) {
  return function(proto, name, descriptor) {
    if(name !== 'group' || name !== 'both') {
      Logger.warn("trigger decorator only works with group or both function.")
    }
    else
      proto.triggerType = type;
  };
}

// 用于group和both。设置群组内什么身份可触发命令
export function scope(role: TriggerScope) {
  return function(proto, name, descriptor) {
    if(name !== 'group' || name !== 'both') {
      Logger.warn("trigger decorator only works with group or both function.")
    }
    else
      proto.triggerScope = role;
  };
}
