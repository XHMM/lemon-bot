import { IHandyRedis } from 'handy-redis';
import { assertType } from '@xhmm/utils';
import { Messages } from './CQHelper';
import { Numbers } from './Command';
import { MessageFromType, getMessageFromTypeFromNumbers } from './utils';

type SessionKey = string;

export interface SessionData extends Numbers {
  fromType: MessageFromType;
  sessionName: string; // 本次会话需要被执行的session函数
  directives: string[]; // 本次会话处理的指令集，可据此判断该session所述类
  historyMessages: Record<string, Messages>; // string是session name
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
    { directives, historyMessages }: Pick<SessionData, 'directives' | 'historyMessages'>,
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
          directives,
          historyMessages,
        })
      )
    );
    await this.redisClient.expire(key, expireSeconds);
  }

  async removeSession(params: Numbers): Promise<void> {
    await this.redisClient.del(Session.genSessionKey(params));
    console.info('[消息处理] session会话结束')
  }
}
