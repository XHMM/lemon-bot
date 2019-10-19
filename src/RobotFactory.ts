import { Express, Request, Response } from 'express';
import { hasRepeat, getType } from '@xhmm/utils';
import { Command, Scope, TriggerType, SessionHandlerParams, Numbers, TriggerScope } from './Command';
import { HttpPlugin } from './HttpPlugin';
import { CQMessageHelper, CQRawMessageHelper } from './CQHelper';
import { Session, SessionData } from './Session';
import { getMessageFromTypeFromRequest, getMessageFromTypeFromNumbers, MessageFromType } from './utils';
import { Logger } from './Logger';

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
    commands: CreateParams['commands'];
    port: PortV;
    session: CreateParams['session'];
    qq: QQV;
  }
>;
type AppsMap = Record<PortK, [Express, 'listening' | 'idle']>;

export class RobotFactory {
  // 不同机器人和其命令以及运行在的node端口
  private static commandsMap: CommandsMap = {};
  // 不同端口和对应的node服务器
  private static appsMap: AppsMap = {};

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

    {
      // 验证commands参数是否都合法
      const allDirectives: Directive[] = [];
      for (const command of commands) {
        Command.validate(command);
        allDirectives.push(...command.directives);
      }
      if (hasRepeat(allDirectives)) throw new Error('所有的Command对象间的指令不能重复');

      // ----- 验证robotQQ是否合法
      if (Object.keys(RobotFactory.commandsMap).includes(robot + ''))
        throw new Error(`机器人${robot}已存在，不可重复创建`);

      // ----- 注册信息
      Logger.debug(`Robot ${robot}:`);
      if (session) Logger.debug(` - [功能] session函数处理已启用`);
      else Logger.debug(` - [功能] session函数处理未开启`);
      for (const [index, command] of Object.entries(commands)) {
        Logger.debug(
          ` - [命令] 指令集:${command.directives.join(',')}  解析函数:${command.parse ? '有' : '无'}  作用域:${
            command.scope
          }  ${
            command.scope === Scope.user ? '' : `是否艾特:${command.triggerType ? command.triggerType : TriggerType.at}`
          }${+index === commands.length - 1 ? '\n' : ''}`
        );
        command.context = context || null; // 注册context
        command.httpPlugin = httpPlugin; // 注册httpPlugin
      }
      RobotFactory.commandsMap[robot + ''] = {
        commands: commands,
        port,
        session,
        qq: robot,
      };
    }

    // TODO: 抽离该部分代码
    // ----- 若该端口下服务器未创建，则创建并注册
    if (!Object.keys(RobotFactory.appsMap).includes(port + '')) {
      const express = require('express');
      const crypto = require('crypto');
      const app = express();
      app.use(express.json());
      RobotFactory.appsMap[port + ''] = [app, 'idle'];

      app.post('/coolq', async (req: Request, res: Response) => {
        if (+req.header('X-Self-ID')! !== robot) {
          Logger.debug('[请求终止] 请求来源和当前机器人不符，不做处理');
          res.end();
          return;
        }
        if (secret) {
          let signature = req.header('X-Signature');
          if (!signature) throw new Error('无X-Signature请求头，请确保HTTP插件的配置文件配置了secret选项');
          signature = signature.split('=')[1];

          const hmac = crypto.createHmac('sha1', secret);
          hmac.update(JSON.stringify(req.body));
          const test = hmac.digest('hex');
          if (test !== signature) {
            Logger.debug('[请求终止] 消息体与签名不符，结束');
            res.end();
            return;
          }
        }

        // ------------------------------------------------------------------------
        // ------------ 请求信息统一在此设置，后面代码不要使用req.body的值-------------
        // ------------------------------------------------------------------------
        const message = req.body.message && CQMessageHelper.normalizeMessage(req.body.message);
        const rawMessage = req.body.raw_message && req.body.raw_message;
        const messageFromType = getMessageFromTypeFromRequest(req);
        if (messageFromType === 'unhandled') {
          Logger.debug('[请求终止]  暂不支持的消息类型，不做处理');
          res.end();
          return;
        }

        const isGroupMessage = messageFromType === 'group';
        const isAnonymousMessage = messageFromType === 'anonymous';
        const isUserMessage = messageFromType === 'user';
        const isAt = CQMessageHelper.isAt(robot, message);

        const requestBody = req.body;
        const userNumber = isAnonymousMessage ? null : req.body.user_id;
        const userRole = req.body.sender.role || 'member';
        const groupNumber = req.body.group_id;
        const robotNumber = robot;
        const numbers: Numbers = {
          fromUser: userNumber,
          fromGroup: groupNumber,
          robot: robotNumber,
        };
        // ------------------------------------------------------------------------
        // ------------------------------------------------------------------------
        // ------------------------------------------------------------------------

        const noSessionError = (): never => {
          throw new Error('未设置session参数，无法使用该函数');
        };
        let sessionData: SessionData | null = null;
        if (session) {
          sessionData = await session.getSession(numbers);
        }
        // 若找到了sessionData，则必须要提供相关处理数据，否则报错
        if (sessionData) {
          for (const command of RobotFactory.commandsMap[robot].commands) {
            const className = command.constructor.name
            if (sessionData.className !== className) continue;
            // @ts-ignore
            const sessionNames = Object.getOwnPropertyNames(command.__proto__)
              .filter(item => item.startsWith('session') && item !== 'constructor')
              .map(item => item.slice(7));
            if (sessionNames.includes(sessionData.sessionName)) {
              const setNext = session
                ? session.setSession.bind(session, numbers, {
                    className: sessionData.className,
                    historyMessage: {
                      ...sessionData.historyMessage,
                      [sessionData.sessionName]: message,
                    },
                  })
                : noSessionError;
              const setEnd = session ? session.removeSession.bind(session, numbers) : noSessionError;
              const sessionHandlerParams: SessionHandlerParams = {
                setNext,
                setEnd,
                ...numbers,
                message,
                requestBody,
                rawMessage,
                historyMessage: sessionData.historyMessage,
              };
              const replyData = command[`session${sessionData.sessionName}`].call(command, sessionHandlerParams);
              const messageFromType = getMessageFromTypeFromNumbers(numbers);
              await handleReplyData(res, replyData, {
                matchGroupScope:
                  messageFromType === MessageFromType.group || messageFromType === MessageFromType.anonymous,
                matchUserScope: messageFromType === MessageFromType.user,
                userNumber,
                groupNumber,
                httpPlugin,
              });
              Logger.debug(
                `[消息处理] 使用${className}类的session${sessionData.sessionName}函数处理完毕`
              );
              return;
            }
          }
          res.end();
          await session!.removeSession(numbers);
          Logger.warn(
            `[消息处理] 未在${sessionData.className}类中找到与缓存匹配的session${
              sessionData.sessionName
            }函数，当前会话已重置`
          );
        }
        // 若无session或是sessionData为null，则按正常流程解析并处理指令
        else {
          for (const command of RobotFactory.commandsMap[robot].commands) {
            const className = command.constructor.name;
            const { includeGroup, excludeGroup, includeUser, excludeUser, scope, directives } = command;
            const parse = command.parse && command.parse.bind(command);
            const user = command.user && command.user.bind(command);
            const group = command.group && command.group.bind(command);
            const both = command.both && command.both.bind(command);
            const triggerType = command.triggerType || TriggerType.both;
            const triggerScope = command.triggerScope || TriggerScope.all;

            // 判断当前命令和消息源是否匹配
            const matchGroupScope =
              (scope === Scope.group || scope === Scope.both) &&
              (isGroupMessage || isAnonymousMessage)
            const matchUserScope =
              (scope === Scope.user || scope === Scope.both) &&
              isUserMessage

            if (matchGroupScope || matchUserScope) {
              if (matchGroupScope) {
                if (triggerType === TriggerType.at && !isAt) continue;
                if (triggerType === TriggerType.noAt && isAt) continue;

                if (includeGroup && !includeGroup.includes(groupNumber)) continue;
                if (excludeGroup && excludeGroup.includes(groupNumber)) continue;

                // @ts-ignore
                if ((TriggerScope[userRole] & triggerScope) === 0) continue;
              }
              if (matchUserScope) {
                if (includeUser && !includeUser.includes(userNumber)) continue;
                if (excludeUser && excludeUser.includes(userNumber)) continue;
              }

              // --- 根据指令或解析函数进行处理
              let parsedData = null;
              const baseInfo = {
                requestBody,
                message,
                rawMessage,
                ...numbers,
              };
              if (parse) {
                // 若parse函数返回非undefined，表明解析成功，否则继续循环
                parsedData = await parse({
                  ...baseInfo,
                });
                if (typeof parsedData === 'undefined') {
                  continue;
                }
                Logger.debug(`[消息处理] 使用${className}类的parse函数处理通过`)
              }
              // 若无parse函数，则直接和指令集进行相等性匹配，不匹配则继续循环
              else {
                if (!directives.includes(CQRawMessageHelper.removeAt(rawMessage))) {
                  continue;
                }
                Logger.debug(`[消息处理] 使用${className}类的指令集处理通过`)
              }
              command.data = parsedData || null; // 注册data

              let replyData;
              // 若提供了both函数，则不再调用user/group函数
              if ((matchUserScope || matchGroupScope) && both) {
                replyData = await both({
                  ...baseInfo,
                  messageFromType: getMessageFromTypeFromNumbers(numbers),
                  setNext: session
                    ? session.setSession.bind(session, numbers, {
                        className,
                        historyMessage: {
                          both: message,
                        },
                      })
                    : noSessionError,
                });
                Logger.debug(
                  `[消息处理] 使用${className}类的both函数处理完毕${
                    typeof replyData === 'undefined' ? '(无返回值)' : ''
                  }`
                );
              } else {
                if (matchGroupScope && group) {
                  replyData = await group({
                    ...baseInfo,
                    fromGroup: baseInfo.fromGroup!,
                    isAt,
                    setNext: session
                      ? session.setSession.bind(session, numbers, {
                          className,
                          historyMessage: {
                            group: message,
                          },
                        })
                      : noSessionError,
                  });
                  Logger.debug(
                    `[消息处理] 使用${className}类的group函数处理完毕${
                      typeof replyData === 'undefined' ? '(无返回值)' : ''
                    }`
                  );
                }
                if (matchUserScope && user) {
                  replyData = await user({
                    ...baseInfo,
                    fromUser: baseInfo.fromUser!,
                    fromGroup: undefined,
                    setNext: session
                      ? session.setSession.bind(session, numbers, {
                          className,
                          historyMessage: {
                            user: message,
                          },
                        })
                      : noSessionError,
                  });
                  Logger.debug(
                    `[消息处理] 使用${className}类的user函数处理完毕${
                      typeof replyData === 'undefined' ? '(无返回值)' : ''
                    }`
                  );
                }
              }
              await handleReplyData(res, replyData, {
                matchGroupScope,
                matchUserScope,
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
    }

    // 启动服务器，即调用listen方法
    function start(): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        const [app, status] = RobotFactory.appsMap[port];
        if (status === 'idle') {
          RobotFactory.appsMap[port][1] = 'listening';
          app
            .listen(port, () => {
              resolve();
              Logger.debug(`[普通日志] http server listening on http://localhost:${port}/coolq`);
            })
            .on('error', err => {
              Logger.error(err);
              reject(err);
            });
        } else {
          resolve();
        }
      });
    }
    // 停止当前机器人，则移除当前停止机器人的注册信息
    function stop(): void {
      delete RobotFactory.commandsMap[robot + ''];
      // TODO: 添加'同时停止node服务器'选项
      // 得用createServer().close(), 所以得改下对象存储结果
    }
    return {
      start,
      stop,
    };
  }
}

async function handleReplyData(
  res: Response,
  replyData,
  deps: {
    matchUserScope: boolean;
    matchGroupScope: boolean;
    httpPlugin: HttpPlugin;
    userNumber: number;
    groupNumber: number;
  }
): Promise<void> {
  // TODO: TS中自定义类型判断如何做type guard？
  const replyType = getType(replyData);
  if (replyType === 'array') {
    for (const reply of replyData as string[]) {
      if (deps.matchUserScope) await deps.httpPlugin.sendPrivateMsg(deps.userNumber, reply.toString());
      if (deps.matchGroupScope) {
        await deps.httpPlugin.sendGroupMsg(deps.groupNumber, reply.toString());
      }
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
