<h1>🍋 Lemon-Bot</h1>

cqhttp 4.15  
nodejs todo

一个基于酷Q和CoolQ HTTP API插件的QQ机器人Nodejs开发框架。

- 支持多命令匹配、命令自定义解析

- 使用修饰器进行灵活的命令触发控制

- 支持会话上下文功能

- 支持多机器人运行

- and more ...

  

## 前言

该项目仍处于早期开发版，故版本变动较为频繁，但会尽可能保证基本开发方式不变，具体变动见 [Changelog](https://github.com/XHMM/lemon-bot/blob/master/CHANGELOG.md)

## 准备

1. 安装 [nodejs](https://nodejs.org/en/download/)

2. 安装 酷Q 和 HTTP插件：

   - Windows: 首先前往酷Q的[版本发布](https://cqp.cc/b/news)页面下载（Air为免费版，Pro为收费版），下载后解压启动 `CAQ.exe` 或 `CQP.exe` 并登陆你的QQ机器人账号。然后根据[CoolQ HTTP API插件文档](https://cqhttp.cc/docs/)中的"手动安装"部分的教程进行插件安装。
   - Linux / Mac: 查看[CoolQ HTTP API插件文档](https://cqhttp.cc/docs/)中的"使用Docker"部分的教程进行安装

3. 修改 HTTP插件 配置：

   每个账号的配置文件存放路径一般为 `/path/to/酷Q/data/app/io.github.richardchien.coolqhttpapi/config/QQ号.json` (也可能是 `.ini` 格式)。 附：[插件文档](https://cqhttp.cc/docs/#/Configuration?id=配置项)

   - 非docker环境：手动前往配置文件所在目录进行修改：

     ```metadata json
     {
       "port": 5700, // HTTP插件的运行端口，请自行指定或使用默认值
       "use_http": true, // 须设为true
       "post_url": "http://127.0.0.1:8888/coolq", // 这是node服务器的运行地址以及监听的路由，你只可以修改端口号，请勿修改路由地址
       "access_token": "", // 可选。若指定此值，则使用框架时也须配置
       "secret": "", // 可选。若指定此值，则使用框架时也须配置
       "post_message_format": "array" // 【重要】请务必将该选项设为array
     }
     ```

   - docker环境: 使用环境变量注入的形式来在容器创建时设置好配置，或是手动前往挂载目录下按照上述修改配置文件。

4. 安装该node包： `npm i lemon-bot`

5. 由于该框架使用了 [decorator](https://www.typescriptlang.org/docs/handbook/decorators.html) 语法:

   - 若你是使用 Javascript 进行开发，则需要[配置babel](https://babeljs.io/docs/en/babel-plugin-proposal-decorators)以支持该特性。

   - 若是使用 Typescript，则需要在`tsconfig.json`中启用decorator：

     ```metadata json
     {
       "compilerOptions": {
         "experimentalDecorators": true,
     
         // 此外，由于该框架的编译版本为es6，故请务必设置自己的target为 *非es5*, 否则会报错
         "target": "es6"
       }
     }
     ```

6. 该框架使用 `debug` 模块进行日志打印。在开发阶段建议开启日志输出来方便调试和排错：设置环境变量  `DEBUG=lemon-bot*` ，然后运行主程序即可。

## Demo

在 `index.ts` 文件里写入下述代码：

```js
import { Command, RobotFactory, HttpPlugin } from "lemon-bot";

class SimpleCommand extends Command {
  // 当机器人接收到"测试"或是"test"文本后，会触发该命令
  directive() {
    return ["测试", "test"];
  }

  // 当消息是私发给机器人时，会使用user函数进行响应
  user({ fromUser }) {
    return "你好呀" + fromUser;
  }

  // 当机器人在QQ群内并检测到上述指令后，会使用group函数进行响应
  group({ fromUser, fromGroup }) {
    // 返回值为数组时，机器人会连续发送多条消息。
    return ["触发群是" + fromGroup, "触发用户是" + fromUser];
  }
}

const robot = RobotFactory.create({
  port: 8888, // node应用的运行端口。需要和插件配置文件的post_url对应
  robot: 1326099664, // 机器人QQ号
  httpPlugin: new HttpPlugin("http://localhost:5700"), // 用于调用HTTP Plugin API
  commands: [new SimpleCommand()] // 该机器人可处理的命令
});

robot.start(); // 启动
```

在运行该代码前，请确保：

- 酷Q和HTTP插件处于运行状态，且上述代码中的 `robot` 值为当前登录的机器人QQ
- 按照要求修改了HTTP插件的配置文件

然后在命令行内输入 `npx ts-node index.ts` 即可启动机器人。

一对一聊天测试：用一个加了机器人为好友的QQ号向机器人发送 "测试" 或 "test" ，会发现机器人返回了 "你好呀[你的QQ号]"。

群聊测试：将该机器人拉入群内，然后在群内发送"测试"或"test"，会发现机器人连续返回了两条消息:  "触发群是[机器人所在Q群]" 和 "触发用户是[你的QQ号]"。

## 案例

- [小心机器人](https://github.com/XHMM/bot-xiaoxin)

## API文档

Tips：下述涉及的类型定义和enum定义可直接前往源码内查看，可帮助更好的理解其含义。

### Class RobotFactory

该类用于机器人的创建。

#### static create(config: CreateParams): CreateReturn

`CreateParams`：该函数所需参数是一个对象，接受如下属性：

| key        | type       | description                                            | optional |
| ---------- | ---------- | ------------------------------------------------------ | -------- |
| port       | number     | node服务器的运行端口                                   |          |
| robot      | number     | 机器人QQ号                                             |          |
| httpPlugin | HttpPlugin | HTTP插件实例                                           |          |
| commands   | Command[]  | 需要注册的命令                                         |          |
| session    | Session    | 传入该参数运行使用session函数                          | optional |
| secret     | string     | 须和HTTP插件配置文件值保持一致，用于对上报数据进行验证 | optional |
| context    | any        | 该属性可在Command类中使用`this.context`访问     | optional |

`CreateReturn`：该函数的返回值是一个对象，包含如下属性

| key   | type              | description |
| ----- | ----------------- | ----------- |
| start | ()=>Promise<void> | 启动机器人  |
| stop  | () => void        | 停止机器人  |

Example：

```js
const robot = RobotFactory.create({
  port: 8888,
  robot: 1326099664,
  httpPlugin: new HttpPlugin("http://localhost:5700"),
  commands: [new SimpleCommand()]
});
robot.start();
```



### Class Command

该类需要被继承使用，用来创建命令。下面将以继承类的角度进行描述：

#### 继承类的基本结构：

```typescript
// 导入基类
import { Command} from 'lemon-bot';
// 导入ts类型定义提升开发体验
import { ParseParams, ParseReturn, UserHandlerParams, GroupHandlerParams, SessionHandlerParams, HandlerReturn } from 'lemon-bot'

class MyCommand extends Command<C> {
    // 下面两个实例属性是默认提供的，可在函数内直接访问，故请不要出现同名属性。
    context: C;
    httpPlugin;
    
    // 下面的[directive函数]和[parse函数]必须至少提供一个
    directive(): string[]
    parse(params: ParseParams): ParseReturn

    // 下面的三种函数必须至少提供一个
    user(params: UserHandlerParams): HandlerReturn
    group(params: GroupHandlerParams): HandlerReturn
    both(params: BothHandlerParams): HandlerReturn
    
    // 下面的函数都是以session开头，叫做[session函数]，可提供任意多个，详见下方文档描述
    sessionA(params: SessionParams): HandlerReturn
    sessionB(params: SessionParams): HandlerReturn
}
```

#### 属性、函数说明：

##### context属性

该属性的值等同于使用 `RobotFactory.create` 时传给 `context `参数的内容，默认为null。

##### httpPlugin属性

该属性的值为使用 `RobotFactory.create` 时传给 `httpPlugin` 参数的内容。

##### **directive**函数

该函数应返回一个字符串数组。假如它返回了 `["天气", "weather"]` ，并且**没有**定义 `parse函数` 时，当接收到用户消息后，会判断消息内容是否等于"天气"或者"weather"，若相等，则会执行 `user函数` 或 `group函数` 或 `both函数` ，若不相等，则会进行下一个命令的判断。(该函数的触发条件同样会受到下述`trigger`修饰器的约束)

##### parse函数

上面的 `directive函数` 无法实现自定义命令解析，比如想要获取 "天气 西安" 这一消息中的城市信息，则需要使用 `parse函数` 手动处理，该函数的返回值信息可在 `user函数` 、`group函数`、`both函数` 的参数中访问。**提醒：** 若提供了该函数，则不会再使用 `directive` 函数进行命令处理。

`directive函数` 和 `parse函数` 是允许同时存在的，并且十分建议不要省略 `directive函数` 的声明，因为通过该函数的返回值内容可以提升代码阅读性，方便识别该命令的用途。

##### user函数

提供该函数表示当前命令支持用户和机器人私聊的场景。

##### group函数

提供该函数表示当前命令支持群组聊天下的场景。**提醒** ：群组消息包括了 匿名 和 非匿名 两种情况，故该函数参数的 `fromUser` 字段可能为QQ号，也可能为一个对象描述了匿名用户信息。可使用该函数参数中的 `messageFromType` 判断。

##### both函数

当你的命令处理逻辑在私聊和群聊下比较相似时，若同时提供 `user函数` 和 `group函数` 会增加代码冗余，故该 `both函数` 就是用来同时处理来自私聊或群聊的消息。**提醒：**若提供了该函数，则 `user函数` 和 `group函数` 会无效。此外，你需要手动判断消息源是用户消息、群组非匿名消息还是群组匿名消息，可使用函数参数的`messageFromType` 字段来判断。

##### session函数

该函数的功能参见下方[session函数](#class-session)的描述。

#### 函数参数说明：

上述函数中，`directive函数` 是无参的，其余类型的函数参数都是一个对象，该对象的属性内容如下（scope列描述了该属性存在于哪些函数，all表示每个函数都有该参数）：

| key             | type                                                         | description                                                  | scope                   |
| --------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ----------------------- |
| data            | any                                                          | 值为 `parse` 函数的返回值                                    | user,group,both         |
| message         | Message[]                                                    | 以二维数组的形式表示的消息内容                               | all                     |
| rawMessage      | string                                                       | 以字符串形式表示的消息内容                                   | all                     |
| requestBody     | any                                                          | 原始http请求的body数据，具体内容可查看HTTP插件文档           | all                     |
| fromUser        | number\| AnonymousUser                                       | 发送消息者的QQ，为非数字时代表是匿名用户                     | all                     |
| fromGroup       | number\|undefined                                            | 发送消息者所在的Q群，`user函数`中的该值为 `undefined`        | all                     |
| robot           | number                                                       | 执行该指令的机器人                                           | all                     |
| isAt            | boolean                                                      | 是否艾特了机器人                                             | group                   |
| messageFromType | enum MessageFromType                                         | 消息来自方：group指群聊, anonymous指群内匿名聊, user指私聊   | user,group,both         |
| setEnd          | () => Promise<void>                                          | 是个异步函数，用来设置会话上下文结束                         | session                 |
| historyMessage  | Record<string, Array<Message[]>>                             | 一个对象，保存了历史会话消息，key为在 `group函数` 或 `user函数` 内调用`setNext`时指定的参数名称 (含‘session’单词前缀) | session                 |
| setNext         | (sessionName: string, expireSeconds?: number) => Promise<void> | 是个异步函数，用来设置下一个需要执行的`session函数`          | user,group,both,session |

#### 函数返回值：

##### parse函数

- 无返回值或是返回了 `undefined`：表示用户消息不满足该命令的处理条件
- 其他任意类型的值：该值在 `user函数` 、`group函数`、`both函数` 参数的 `data` 属性中访问到

##### user函数、group函数、session函数

- 无返回值或是返回了`undefined`：表示处理完毕，但不返回任何消息
- `{ atSender:boolean, content: string }`：为一个对象时，`atSender` 表示是否艾特发送者(仅群聊有效)，`content` 为响应内容
- `string[]`：表示连续响应多条消息
- `string`：表示响应一条不艾特发送者的消息



#### 装饰器：

##### include( number[] )

可用于 `group函数` 和 `user函数`，表示只有这些QQ群/QQ号才可以触发该命令：

```js
@include([ 12312, 21223 ])
user() {} //只有QQ为为它俩的用户可触发该命令

@include([ 3423344 ])
group() {} // 只有QQ群号为它的群可触发该命令
```

##### exclude( number[] )

可用于 `group函数` 和 `user函数`，表示这些QQ群/QQ号不能触发该命令。**同时使用`include`和`exclude`会报错。**

```js
@exclude([ 12312, 21223 ])
user() {} // 除了上述两位QQ用户不能触发该命令，其他用户可触发

@include([ 3333 ])
group() {} // 只有群号为3333的群可触发该命令
```

##### trigger( triggerType )

可用于 `group函数` 和 `user函数`，表示命令触发方式，可赋值为：

- `TriggerType.at` ：用户必须艾特机器人并发送消息方可触发命令
- `TriggerType.noAt`：用户之间在群内发送消息可触发命令，艾特机器人即使命令正确也不会触发
- `TriggerType.both`  (默认值)：艾特或者不艾特机器人都可触发命令

```js
@trigger(TriggerType.noAt)
group() {}
```

##### scope( triggerScope )

可用于 `group函数` 和 `user函数`，表示什么身份的用户可触发该命令，可赋值为：

- `TriggerScope.all` (默认值)：所有用户都可触发
- `TriggerScope.owner`：仅群主可触发
- `TriggerScope.admin`：仅管理员可触发
- `TriggerScope.member`：仅普通成员可触发
- 使用或运算`|`产生组合值：比如 `TriggerScope.owner | TriggerScope.admin` 表示群主和管理员可触发

```js
@trigger(TriggerScope.all)
group() {}
```



### Class CQMessageHelper

一个用来处理数组格式消息的工具类，该方法接收的 `message` 参数即为 `user函数` 、`group函数`、`both函数` 、`session函数` 参数的 `message` 属性。

##### static removeAt(message: Message[]): Message[]

移除消息数组的艾特语句

##### static isAt(robotQQ: number, message: Message[]): boolean

判断消息数组是否含有艾特robotQQ的语句

##### static toRawMessage(message: Message[], removeAt?: boolean): string

将消息数组转换为字符串形式，特殊形式的信息则会变成[CQ码](https://docs.cqp.im/manual/cqcode/)形式。

### Class CQRawMessageHelper

一个用来字符串格式消息的工具类。该方法接收的 `message` 参数即为 `user函数` 、`group函数`、`both函数` 、`session函数` 参数的 `rawMessage` 属性。

##### static removeAt(message: string): string

移除字符串消息中的艾特CQ码



### Class HttpPlugin

该类用于主动调用[HTTP插件提供的API](https://cqhttp.cc/docs/#/API?id=api-列表)。

#### constructor(endpoint: string, config?: PluginConfig)

| key      | type         | description        | optional |
| -------- | ------------ | ------------------ | -------- |
| endpoint | string       | HTTP插件的运行地址 |          |
| config   | PluginConfig | 插件配置信息       | optional |

`PluginConfig`：一个对象，包含如下属性

| key         | type   | description                                                | optional |
| ----------- | ------ | ---------------------------------------------------------- | -------- |
| accessToken | string | 须和HTTP插件配置文件值保持一致。在调用API时会验证该token。 | optional |

该类提供的实例方法名称是[HTTP插件文档](https://cqhttp.cc/docs/#/API?id=api-列表)提供API的 **驼峰式命名**，方法的返回值一个promise，其resolve值等同于HTTP插件文档的json对象，但方法的参数类型请以下述文档为准。

目前提供了如下接口的实现：

##### sendPrivateMsg(personQQ: number, message: string, escape?: boolean)

##### sendGroupMsg(groupQQ: number, message: string, escape?: boolean)

##### sendMsg(numbers: { user?: number;  group?: number; }, message: string, escape?: boolean)

##### getGroupList()

##### getGroupMemberList(groupQQ: number)

##### downloadImage(cqFile: string)



### Class Session

该类用于启用上下文功能。

#### constructor(options? any)

该构造函数的参数类型同 [ioredis]( https://github.com/luin/ioredis/blob/master/API.md#Redis ) 库的`Redis` 构造函数的参数类型，example：

```js
import { RobotFactory, HttpPlugin, Session } from 'lemon-bot';

const robot = RobotFactory.create({
  // ...
  session: new Session(6379)
});
```

#### 如何启用上下文功能？

通过在 `create` 函数里传入 `session` 参数(如上述代码所示)，即可开启使用`session函数`/上下文功能。

#### 什么是session函数？

`session函数` 指的是以"session"单词开头的写在Command继承类里的函数，继承类里可以有任意多个 `session函数`。在 `session函数` 未过期前，接下来发给机器人的消息即使满足了其他命令的处理条件，但并不会执行他们，而是直接执行 `session函数`中的逻辑，直到session过期或调用 `setEnd` 手动结束。

#### 如何使用session函数？

在 `user函数` 或 `group函数` 的参数中有个 `setNext` 属性，在 `session函数` 的参数中有 `setNext` 和 `setEnd` 这两个属性，他们都是异步函数，通过调用它们即可触发上下文功能，下面是函数说明：

- `setNext(name: string, expireSeconds?: number): Promise<void>` ：`name`的值为其他 `session函数` 的函数名或是省略"session"单词后的部分 (**警告：** `name` 是大小写敏感的)，`expireSeconds` 选填，表示会话过期时间，默认为5分钟。

  调用 `setNext` 后，当机器人再次接受到该用户会话后，将直接执行 `setNext` 参数指定的函数。然后你可以继续调用 `setNext` 指定其他函数，每次执行 `session函数` 时，都可以获取到历史消息记录，从而进行自己的逻辑处理。

- `setEnd(): Promise<void>` ：

  调用该函数表示结束当前会话上下文，当机器人再次接收到消息后，将会按照常规的解析流程处理：即先判断 `directive函数` 的返回值或者是执行 `parse函数`，然后执行 `group函数` 或 `user函数` 。**警告：** 请别忘记调用该函数来终止会话，否则在session过期前将会一直执行本次的session函数。

#### session函数demo：

现在我们改造上面Demo部分中的代码，来演示 `session函数` 的使用，

**警告：** 下述例子设置了`count` 实例属性，由于不同的HTTP请求会共享命令，以及可能的并发等原因，无法确保`count` 属性的值与预期一致，故强烈不建议在类中设置实例属性，共享属性可使用第三方存储如 `redis` 来进行保存。下述代码仅为演示session函数的使用：

```js
import { Command, RobotFactory, HttpPlugin, Session } from "lemon-bot";

class SimpleCommand extends Command {
  count = 3;

  directive() {
    return ["测试", "test"];
  }

  async user({ fromUser, setNext }) {
    await setNext('A');
    return "user run with " + this.count;
  }

  async sessionA({ setNext }) {
    this.count--;
    await setNext("B", 10);
    return "sessionA run with " + this.count;
  }

  async sessionB({ setNext }) {
    this.count--;
    await setNext("sessionC");
    return "sessionB run with " + this.count;
  }

  async sessionC({ setNext, setEnd }) {
    this.count--;
    await setEnd();
    return "sessionC run with 结束";
  }
}

const robot = RobotFactory.create({
  port: 8888,
  robot: 834679887,
  httpPlugin: new HttpPlugin("http://localhost:5700"),
  commands: [new SimpleCommand()],
  session: new Session()
});

robot.start();
```

运行上述代码前，请确保 ：

- redis处于运行状态并可访问其默认的6379端口
- `robot`字段为你当前酷Q登陆的账号

然后在命令行内输入 `npx ts-node index.ts` 启动机器人，然后开始向你的机器人发送下面的信息：

- 发送 "测试"：会执行 `user函数` ，返回 "user run with 3"
- 发送 任意消息：会执行 `sessionA`，返回"sessionA run with 2"
- 10s内发送任意消息：会执行 `sessionB`，返回"sessionB run with 1"
- 发送 任意消息：会执行 `sessionC`，返回"sessionC run with 结束"
- 发送 "测试"：将重新从 `user函数`开始解析，返回 "user run with 0"

## 安全指南

1. 尽可能避免HTTP插件的上报地址(即node服务器地址)可被外网访问，这会导致收到恶意请求。
2. 尽可能避免HTTP插件的运行地址可被公网访问，这会导致攻击者可进行API调用。若必需要公网下可访问，则应在配置文件中配置 access_token ，然后在代码的 `HttpPlugin` 实例中传入 `accessToken`参数，设置后，当在调用API时会自动验证token值。



## Recipes

### 1. 文件目录如何组织？

建议使用如下结构：

```
+-- commands  
|   +-- SearchQuestionCommand.ts  
|   +-- HelpCommand.ts      
|   +-- WordCommand.ts  
+-- index.ts
```

### 2. 如何提供一个默认的消息处理函数？

假如我们目前的 `commands` 数组是 `[ new ACommand(), new BCommand() ]`，现在我希望当用户发来的消息都不满足这些命令的解析条件时，将它交由一个默认的处理命令：

1. 实现一个返回值始终为 **非`undefined`** 的`parse`函数：

   ```js
   export default class DefaultCommand extends Command {
       parse() {return true;}
       user(){
           return "默认返回"
       }
   }
   ```

2. 将该类的实例对象放在 `commands` 数组的**最后一位** ：

   ```js
   const robot = new RobotFactory.create({
       // ...
       commands: [new ACommand(), new BCommand(), new DefaultCommand()]
   })
   ```

### 3. 如何实现群组下不同成员共享session函数？

比如我想实现这样一个命令: 当我艾特机器人回复"开始收集反馈"后，接下来群员的发言内容会全部被采集，直到我艾特机器人发送 "收集结束"。

答: 目前的 `session函数` 的触发条件必须是 "消息是同一用户发送，如果用户位于群内，必须是在同一个群内发送消息"，目前暂不支持触发条件是 "消息可以来自同一群组的不同用户"的情况。开发者可以通过使用redis并在默认消息处理命令里进行判断是否处于"消息反馈"状态下并进行处理。



## TODO

- [ ] 完善API接口实现
- [ ] 添加非消息事件上报的处理
- [ ] 编写测试😫
- [ ] 使用文档工具生成更易阅读的文档
