import { Server } from "http";
import { Request, Response } from 'express';
import { hasRepeat, type } from '@xhmm/utils';
import * as debugMod from 'debug';
import { Command, Scope, TriggerType, SessionHandlerParams, TriggerScope, RequestIdentity, MessageFromType } from './Command';
import { HttpPlugin } from './HttpPlugin';
import { CQMessageHelper, CQRawMessageHelper, CQMessageFromTypeHelper } from './CQHelper';
import { Session, SessionData } from './Session';
import { error } from './logger';

interface CreateParams<C = unknown> {
  port: number;
  robot: number;
  httpPlugin: HttpPlugin;
  commands: Command[];
  session?: Session | null;
  secret?: string;
  context?: C; // 该对象下内容可在XxxCommand里使用this.context.xx访问
}
interface CreateReturn {
  start(): Promise<void>;
  stop(): void;
}

type QQK = string; // 作为key时，qq是字符串
type QQV = number; // 作为value时，qq是数字
type PortK = string;
type PortV = number;
type Directive = string;
type CommandsMap = Record<
  QQK,
  {
    qq: QQV;
    port: PortV;
    commands: CreateParams['commands'];
    session: CreateParams['session'];
    secret: string;
    httpPlugin: HttpPlugin;
  }
>;
type ServersMap = Record<PortK, [Server, 'listening' | 'idle']>;

export class RobotFactory {
  // 不同机器人和其命令以及运行在的node端口
  private static commandsMap: CommandsMap = {};
  // 不同端口和对应的node服务器
  private static serversMap: ServersMap = {};

  public static create<C>({
    port,
    robot,
    httpPlugin,
    commands,
    session = null,
    secret = '',
    context,
  }: CreateParams<C>): CreateReturn {
    // note: Object.keys(obj)返回的都是字符串类型！

    const debug = debugMod(`lemon-bot[QQ:${robot} PORT:${port}]`);

    const allDirectives: Directive[] = [];
    for (const command of commands) {
      allDirectives.push(...command.directives);
    }
    if (hasRepeat(allDirectives)) throw new Error(`Command类中出现了重复指令，请对重复得到指令名进行修改：\n${allDirectives}`);

    // 验证robotQQ是否合法
    if (Object.keys(RobotFactory.commandsMap).includes(robot + ''))
      throw new Error(`机器人${robot}已存在，不可重复创建`);

    // 缓存每个机器人可处理的命令
    if (session) debug(` - session函数处理已启用`);
    else debug(` - session函数处理未开启`);
    for (const [index, command] of Object.entries(commands)) {
      debug(
        ` - [命令] 指令集:${command.directives.join(',')}  解析函数:${command.parse ? '有' : '无'}  作用域:${
          command.scope
        }  ${
          command.scope === Scope.user ? '' : `是否艾特:${command.triggerType}`
        }`
      );
      command.context = context; // 注册context
      command.httpPlugin = httpPlugin; // 注册httpPlugin
    }
    RobotFactory.commandsMap[robot + ''] = {
      commands: commands,
      port,
      session,
      qq: robot,
      secret,
      httpPlugin,
    };

    // 若该端口下服务器未创建，则创建并注册
    if (!Object.keys(RobotFactory.serversMap).includes(port + '')) {
      const app = createServer(RobotFactory.commandsMap, debug);
      RobotFactory.serversMap[port + ''] = [app, 'idle'];
    }

    // 启动服务器，即调用listen方法
    function start(): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        const [app, status] = RobotFactory.serversMap[port];
        if (status === 'idle') {
          RobotFactory.serversMap[port][1] = 'listening';
          app
            .listen(port, () => {
              debug(` - ${port} 端口开始监听运行在 ${httpPlugin.endpoint} 的HTTP插件的事件上报`);
              resolve();
            })
            .on('error', err => {
              error(err);
              reject(err);
            });
        } else {
          debug(` - ${port} 端口开始监听运行在 ${httpPlugin.endpoint} 的HTTP插件的事件上报`);
          resolve();
        }
      });
    }
    // 停止当前机器人，则移除当前停止机器人的注册信息
    function stop(): void {
      delete RobotFactory.commandsMap[robot + ''];
      RobotFactory.serversMap[robot + ''][0].close((err) => {
        debug(` - ${port} 端口已停止监听运行在 ${httpPlugin.endpoint} 的HTTP插件的事件上报`);
      })
    }
    return {
      start,
      stop,
    };
  }
}

function createServer(commandsMap: Readonly<CommandsMap>, debug: any): Server {
  const express = require('express');
  const crypto = require('crypto');
  const http = require('http');

  const app = express();
  const server = http.createServer(app)
  app.use(express.json());

  app.post('/coolq', async (req: Request, res: Response) => {
    const requestRobot = +req.header('X-Self-ID')!;
    if (!requestRobot) {
      debug('[请求终止] 该请求无机器人头信息(X-Self-ID)，不做处理');
      res.end();
      return;
    }
    if (!(requestRobot in commandsMap)) {
      debug(`[请求终止] 请求机器人${requestRobot}不在已注册的的机器人列表，请检查create的robot参数和酷Q登录的机器人是否一致`);
      res.end();
      return;
    }

    /*
      机器人A的create传入port是8888，配置文件post_url是8888
      机器人B的create传入port是8889，配置文件post_url误配为8888，本应是8889
      当给机器人B发消息时会被8888端口服务器处理，故做下述判断解决该情况
   */
    const serverPort = commandsMap[requestRobot].port;
    if (serverPort !== server.address().port) {
      throw new Error(`端口号配置错误，请检查机器人${requestRobot}的HTTP插件配置文件的post_url端口号是否为${serverPort}`)
    }
    const secret = commandsMap[requestRobot].secret;
    if (secret) {
      let signature = req.header('X-Signature');
      if (!signature) throw new Error('无X-Signature请求头，请确保HTTP插件的配置文件配置了secret选项');
      signature = signature.split('=')[1];

      const hmac = crypto.createHmac('sha1', secret);
      hmac.update(JSON.stringify(req.body));
      const test = hmac.digest('hex');
      if (test !== signature) {
        debug('[请求终止] 消息体与签名不符，结束');
        res.end();
        return;
      }
    }

    //// 请求信息统一在此设置，后面代码不要使用req.body的值
    const session = commandsMap[requestRobot].session;
    const httpPlugin = commandsMap[requestRobot].httpPlugin;
    const commands = commandsMap[requestRobot].commands;
    const message = req.body.message && CQMessageHelper.normalizeMessage(req.body.message);
    const rawMessage = req.body.raw_message && req.body.raw_message;
    const messageFromType = CQMessageFromTypeHelper.getMessageFromType({ message_type: req.body.message_type, sub_type: req.body.sub_type });
    if (messageFromType === MessageFromType.unknown) {
      debug('[请求终止] 暂不支持的消息类型，不做处理');
      res.end();
      return;
    }
    const isAt = CQMessageHelper.isAt(requestRobot, message);
    const requestBody = req.body;
    const userRole = req.body.sender.role || 'member';
    const userNumber = CQMessageFromTypeHelper.isQQGroupAnonymousMessage(messageFromType) ? req.body.anonymous : req.body.user_id;
    if (typeof userNumber === 'object' && ('flag' in userNumber)) {
      delete userNumber.flag;
    }
    const groupNumber = req.body.group_id
    const robotNumber = requestRobot;
    //// 请求信息统一在此设置，后面代码不要使用req.body的值 END

    const requestIdentity: RequestIdentity = {
      messageFromType,
      fromGroup: groupNumber,
      fromUser: userNumber,
      robot: robotNumber,
    };

    const noSessionError = (): never => {
      throw new Error('未设置session参数，无法使用该函数');
    };
    let sessionData: SessionData | null = null;
    if (session) {
      sessionData = await session.getSession(requestIdentity);
    }
    // 若找到了sessionData，则必须要提供相关处理数据，否则报错
    if (sessionData) {
      for (const command of commands) {
        const className = command.constructor.name;
        if (sessionData.className !== className) continue;
        // @ts-ignore
        const sessionNames = Object.getOwnPropertyNames(command.__proto__)
          .filter(item => {
            // @ts-ignore
            return item.startsWith('session') && typeof command.__proto__[item] === 'function'
          });
        if (sessionNames.includes(sessionData.sessionName)) {
          const storedHistoryMessage = sessionData.historyMessage;
          if (sessionData.sessionName in storedHistoryMessage)
            storedHistoryMessage[sessionData.sessionName].push(message);
          else storedHistoryMessage[sessionData.sessionName] = [message];
          if (session) await session.updateSession(requestIdentity, 'historyMessage', storedHistoryMessage);
          const setNext = session
            ? session.setSession.bind(session, requestIdentity, {
                className: sessionData.className,
                historyMessage: storedHistoryMessage,
              })
            : noSessionError;
          const setEnd = session ? session.removeSession.bind(session, requestIdentity) : noSessionError;
          const sessionHandlerParams: SessionHandlerParams = {
            setNext,
            setEnd,
            ...requestIdentity,
            message,
            requestBody,
            rawMessage,
            historyMessage: sessionData.historyMessage,
          };
          const replyData = await command[sessionData.sessionName].call(command, sessionHandlerParams);
          await handleReplyData(res, replyData, {
            userNumber,
            groupNumber,
            httpPlugin,
          });
          debug(`[消息处理] 使用${className}类的session${sessionData.sessionName}函数处理完毕`);
          return;
        }
      }
      res.end();
      await session!.removeSession(requestIdentity);
      debug(
        `[消息处理] 未在${sessionData.className}类中找到与缓存匹配的${
          sessionData.sessionName
        }函数，当前会话已重置`
      );
    }
    // 若无session或是sessionData为null，则按正常流程解析并处理指令
    else {
      for (const command of commands) {
        const className = command.constructor.name;
        const { includeGroup, excludeGroup, includeUser, excludeUser, scope, directives, triggerScope, triggerType } = command;
        const parse = command.parse && command.parse.bind(command);
        const user = command.user && command.user.bind(command);
        const group = command.group && command.group.bind(command);
        const both = command.both && command.both.bind(command);

        // 判断当前命令和消息源是否匹配
        const matchGroupScope =
          (scope === Scope.group || scope === Scope.both) && CQMessageFromTypeHelper.isQQGroupMessage(messageFromType) ;
        const matchUserScope = (scope === Scope.user || scope === Scope.both) && CQMessageFromTypeHelper.isUserMessage(messageFromType);

        if (matchGroupScope || matchUserScope) {
          if (matchGroupScope) {
            if (triggerType === TriggerType.at && !isAt) continue;
            if (triggerType === TriggerType.noAt && isAt) continue;

            if (!includeGroup.includes(groupNumber)) continue;
            if (excludeGroup.includes(groupNumber)) continue;

            // @ts-ignore
            if ((TriggerScope[userRole] & triggerScope) === 0) continue;
          }
          if (matchUserScope) {
            if (!includeUser.includes(userNumber)) continue;
            if (excludeUser.includes(userNumber)) continue;
          }

          // --- 根据指令或解析函数进行处理
          let parsedData = null;
          const baseInfo = {
            requestBody,
            message,
            rawMessage,
          };
          if (parse) {
            // 若parse函数返回非undefined，表明解析成功，否则继续循环
            parsedData = await parse({
              ...requestIdentity,
              ...baseInfo,
            });
            if (typeof parsedData === 'undefined') {
              continue;
            }
            debug(`[消息处理] 使用${className}类的parse函数处理通过`);
          }
          // 若无parse函数，则直接和指令集进行相等性匹配，不匹配则继续循环
          else {
            if (!directives.includes(CQRawMessageHelper.removeAt(rawMessage))) continue;
            debug(`[消息处理] 使用${className}类的指令集处理通过`);
          }

          let replyData;
          // 若提供了both函数，则不再调用user/group函数
          if ((matchUserScope || matchGroupScope) && both) {
            replyData = await both({
              ...baseInfo,
              ...requestIdentity,
              data: parsedData,
              setNext: session
                ? session.setSession.bind(session, requestIdentity, {
                    className,
                    historyMessage: {
                      both: [message],
                    },
                  })
                : noSessionError,
            });
            debug(
              `[消息处理] 使用${className}类的both函数处理完毕${typeof replyData === 'undefined' ? '(无返回值)' : ''}`
            );
          } else {
            if (matchGroupScope && group) {
              replyData = await group({
                ...baseInfo,
                ...requestIdentity,
                // @ts-ignore
                messageFromType: requestIdentity.messageFromType,
                data: parsedData,
                isAt,
                setNext: session
                  ? session.setSession.bind(session, requestIdentity, {
                      className,
                      historyMessage: {
                        group: [message],
                      },
                    })
                  : noSessionError,
              });
              debug(
                `[消息处理] 使用${className}类的group函数处理完毕${
                  typeof replyData === 'undefined' ? '(无返回值)' : ''
                }`
              );
            }
            if (matchUserScope && user) {
              replyData = await user({
                ...baseInfo,
                ...requestIdentity,
                // @ts-ignore
                messageFromType: requestIdentity.messageFromType,
                data: parsedData,
                setNext: session
                  ? session.setSession.bind(session, requestIdentity, {
                      className,
                      historyMessage: {
                        user: [message],
                      },
                    })
                  : noSessionError,
              });
              debug(
                `[消息处理] 使用${className}类的user函数处理完毕${typeof replyData === 'undefined' ? '(无返回值)' : ''}`
              );
            }
          }
          await handleReplyData(res, replyData, {
            userNumber,
            groupNumber,
            httpPlugin,
          });
          return;
        }
      }
    }
    res.end();
    return;
  });

  return server;
}

async function handleReplyData(
  res: Response,
  replyData,
  deps: {
    httpPlugin: HttpPlugin;
    userNumber?: number;
    groupNumber?: number;
  }
): Promise<void> {
  const replyType = type(replyData);
  if (replyType === 'array') {
    for (const reply of replyData as string[]) {
      await deps.httpPlugin.sendMsg(
        {
          user: deps.userNumber,
          group: deps.groupNumber,
        },
        reply.toString()
      );
    }
    res.end();
    return;
  } else if (replyType === 'object') {
    res.json({
      at_sender: typeof replyData.atSender === 'boolean' ? replyData.atSender : false,
      reply: replyData.content || 'Hi',
    });
    return;
  } else if (replyType === 'string') {
    res.json({
      at_sender: false,
      reply: replyData as string,
    });
    return;
  } else {
    try {
      // 尝试转换为字符串，若不为空则返回
      const str = replyData.toString();
      if (str)
        res.json({
          at_sender: false,
          reply: str as string,
        });
      else res.end();
      return;
    } catch (e) {
      res.end();
    }
  }
}
