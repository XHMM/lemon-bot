import { IHandyRedis } from 'handy-redis';
import { assertType } from '@xhmm/utils';
import * as debugMod from 'debug';
import { Message } from './CQHelper';
import { RequestIdentity } from './Command';

type SessionKey = string;

export type HistoryMessage = Record<string, Array<Message[]>>; // string是session name

export interface SessionData extends RequestIdentity {
  className: string; // 本次会话的session所属类
  sessionName: string; // 本次会话需要被执行的session函数
  historyMessage: HistoryMessage;
}

export class Session {
  private readonly redisClient: IHandyRedis;
  private readonly debug: debugMod.Debugger
  constructor(redisClient: any) {
    this.redisClient = redisClient;
    this.debug = debugMod(`lemon-bot[Session]`)
  }

  private static genSessionKey(params: RequestIdentity): SessionKey {
    const clone = JSON.parse(JSON.stringify(params));
    if (typeof clone.fromUser ==='object' && clone.fromUser.flag) delete clone.fromUser.flag;
    return JSON.stringify(clone);
  }

  async getSession(params: RequestIdentity): Promise<SessionData | null> {
    const data = await this.redisClient.hgetall(Session.genSessionKey(params));
    if (data) {
      Object.keys(data).map(key => {
        try {
          data[key] = JSON.parse(data[key])
        } catch (e) {
          //
        }
      })
      return data;
    }
    return null;
  }

  async setSession(
    params: RequestIdentity,
    data: Omit<SessionData, 'sessionName'| keyof RequestIdentity>,
    sessionName: SessionData['sessionName'],
    expireSeconds = 300
  ): Promise<void> {
    const key = Session.genSessionKey(params);
    sessionName = sessionName.toString();
    assertType(sessionName, 'string');

    if (!sessionName.startsWith('session')) sessionName = 'session' + sessionName;

    const storedData: SessionData = {
      ...params,
      className: data.className,
      historyMessage: data.historyMessage,
      sessionName
    }

    await this.redisClient.hmset(
      key,
      // @ts-ignore
      ...Object.entries(storedData).map(([key, val]) => [key, typeof val==='undefined' ? '': JSON.stringify(val)])
    );
    await this.redisClient.expire(key, expireSeconds);
    this.debug(`Key is ${key}:  函数名为${sessionName}的session函数已建立，时长${expireSeconds}秒`);
  }

  async updateSession<T extends keyof SessionData>(
    params: RequestIdentity,
    hashKey: T,
    val: SessionData[T]
  ): Promise<void> {
    const key = Session.genSessionKey(params);
    await this.redisClient.hset(key, hashKey, JSON.stringify(val));
    this.debug(`Key is ${key}:  该session的${hashKey}字段已被更新`);
  }

  async removeSession(params: RequestIdentity): Promise<void> {
    const key = Session.genSessionKey(params);
    await this.redisClient.del(key);
    this.debug(`Key is ${key}:  该session会话已被清除`);
  }
}
