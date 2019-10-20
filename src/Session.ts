import { IHandyRedis } from 'handy-redis';
import { assertType } from '@xhmm/utils';
import { Message } from './CQHelper';
import { Numbers } from './Command';
import { MessageFromType, getMessageFromTypeFromNumbers } from './utils';
import { Logger } from './Logger';

type SessionKey = string;

export interface SessionData extends Numbers {
  fromType: MessageFromType;
  className: string; // 本次会话的session所属类
  sessionName: string; // 本次会话需要被执行的session函数
  historyMessage: Record<string, Message[]>; // string是session name
}

export class Session {
  private readonly redisClient: IHandyRedis;
  constructor(redisClient: any) {
    this.redisClient = redisClient;
  }

  private static genSessionKey({ fromUser, fromGroup, robot }: Numbers): SessionKey {
    const fromType: MessageFromType = getMessageFromTypeFromNumbers({
      fromUser,
      fromGroup,
      robot,
    });
    return JSON.stringify({
      fromType,
      fromUser,
      fromGroup,
      robot,
    });
  }

  async getSession(params: Numbers): Promise<SessionData | null> {
    const data = await this.redisClient.get(Session.genSessionKey(params));
    if (data) {
      return JSON.parse(data) as SessionData;
    }
    return null;
  }

  async setSession(
    params: Numbers,
    { className, historyMessage }: Pick<SessionData, 'className' | 'historyMessage'>,
    sessionName: SessionData['sessionName'],
    expireSeconds = 300
  ): Promise<void> {
    const key = Session.genSessionKey(params);
    sessionName = sessionName.toString();
    assertType(sessionName, 'string');
    if (sessionName.startsWith('session')) sessionName = sessionName.slice(7);
    await this.redisClient.set(
      key,
      JSON.stringify(
        Object.assign(JSON.parse(key), {
          sessionName,
          className,
          historyMessage,
        })
      )
    );
    await this.redisClient.expire(key, expireSeconds);
    Logger.debug(`[session] Key is ${key}:  函数名为session${sessionName}的session函数已建立，时长${expireSeconds}秒`)
  }

  async removeSession(params: Numbers): Promise<void> {
    const key = Session.genSessionKey(params);
    await this.redisClient.del(key);
    Logger.debug(`[session] Key is ${key}:  该session会话已被清除`)
  }
}
