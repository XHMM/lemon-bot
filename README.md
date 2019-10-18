<h1>🍋 Lemon-Bot</h1>

一个基于酷Q和CoolQ HTTP API插件的QQ机器人Nodejs开发框架。

- 支持多命令匹配、命令自定义解析

- 支持会话上下文功能

- 支持多机器人运行

- and more ...

  

## 准备

1. 安装 [nodejs](https://nodejs.org/en/download/) (该框架基于v10.16.3版本进行开发与测试)

2. 安装 酷Q和HTTP插件：

   - Windows下：
     1. 前往酷Q的[版本发布](https://cqp.cc/b/news)页面下载（Air为免费版，Pro为收费版），下载后解压启动`CAQ.exe`或`CQP.exe`并登陆你的QQ机器人账号
     2. 查看CoolQ HTTP API插件的[文档页面](https://cqhttp.cc/docs/)中的"手动安装"部分的教程进行插件安装
   - Linux/MacOS下：
     1. 查看CoolQ HTTP API插件的[文档页面](https://cqhttp.cc/docs/)中的"使用Docker"部分的教程进行安装

3. 修改HTTP插件的配置文件：每个账号的配置文件存放路径一般为`/path/to/酷Q/data/app/io.github.richardchien.coolqhttpapi/config/QQ号.json` (也可能是`.ini`格式)。下面以`.json`格式说明（详细配置说明见[文档](https://cqhttp.cc/docs/#/Configuration?id=配置项)）：

   ```js
   {
     "host": "[::]",
     "port": 5700, // 该HTTP插件的运行端口
     "use_http": true,
     "post_url": "http://127.0.0.1:8888/coolq", // node服务器的监听地址
     "access_token": "", // 可选。若指定此值，则使用框架时也须配置
     "secret": "", // 可选。若指定此值，则使用框架时也须配置
     "post_message_format": "array" // 请将该选项务必设为array
   }
   ```

4. 若要使用[session函数](#class-session)，则需要安装 [redis](https://redis.io/download)

5. 安装该node模块： `npm i lemon-bot`

6. 该框架需要使用[decorator](https://www.typescriptlang.org/docs/handbook/decorators.html)语法：

   - 若是使用 Javascript 进行开发，则需要[配置babel](https://babeljs.io/docs/en/babel-plugin-proposal-decorators)以支持该写法。

   - 若是采用 Typescript，则需要在`tsconfig.json`中启用decorator：

     ```js
     {
       "compilerOptions": {
         // ...
         "experimentalDecorators": true
       }
     }
     ```



## Demo

在`index.ts`文件里写入下述代码：

```js
import { Command, RobotFactory, HttpPlugin, trigger, TriggerType } from "lemon-bot";

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
  // 在群内默认需要艾特机器人并发送消息才会触发命令，使用trigger修饰器可改变此行为
  // 下面指艾特或不艾特机器人都会触发命令处理
  @trigger(TriggerType.both)
  group({ fromUser, fromGroup }) {
    // 返回值为数组时，机器人会连续发送多条消息。
    return ["触发群是" + fromGroup, "触发用户是" + fromUser];
  }
}

const robot = RobotFactory.create({
  port: 8888, // node应用的运行端口。需要和插件配置文件的post_url对应
  robot: 1326099664, // 机器人QQ号
  httpPlugin: new HttpPlugin("http://localhost:5700"), // 该对象用于主动API调用
  commands: [new SimpleCommand()] // 该机器人可处理的命令
});
robot.start(); // 启动
```

在运行该代码前，请确保：

- 酷Q和HTTP插件处于运行状态
- 对HTTP插件进行了正确配置
- 上述代码中`robot`字段改为自己当前登陆的机器人QQ

然后在命令行内输入`npx ts-node index.ts`即可启动机器人。

一对一聊天测试：用你的QQ向机器人发送 "测试" 或 "test" 文本，会发现机器人返回了 "你好呀[你的QQ号]"。

群聊测试：将该机器人拉入群内，然后在群内发送"测试"或"test"文本，会发现机器人连续返回了两条消息:  "触发群是[机器人所在Q群]" 和 "触发用户是[你的QQ号]"。



## API文档

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
| context    | any        | 该属性可在Command子类内被访问，默认值为null            | optional |

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

#### 继承类的结构：

```typescript
// 导入基类
import { Command} from 'lemon-bot';
// 导入ts类型定义提升开发体验
import {ParseParams, ParseReturn, UserHandlerParams, GroupHandlerParams, SessionHandlerParams, HandlerReturn} from 'lemon-bot'

class MyCommand extends Command<C, D> {
	context: C;
    httpPlugin;
    data: D;
    
    // [下面的directive函数和parse函数必须至少提供一个]
    directive(): string[]
    parse(params: ParseParams): ParseReturn

    // [下面的三个必须至少提供一个]
    user(params: UserHandlerParams): HandlerReturn
    group(params: GroupHandlerParams): HandlerReturn
    both(params: BothHandlerParams): HandlerReturn
    
    // [下面的函数都是以session开头，可提供任意多个，详见下方文档描述]
    sessionA(params: SessionParams): HandlerReturn
    sessionB(params: SessionParams): HandlerReturn
}
```

#### 基本属性：

##### context属性

该实例属性的值为使用`RobotFactory.create`时传给`context`参数的内容，默认为null。

##### httpPlugin属性

该实例属性的值为使用`RobotFactory.create`时传给`httpPlugin`参数的内容。

##### data属性

该实例值为`parse`函数的返回值。因此请勿在`parse`函数内使用该属性。



#### 解析函数：

##### **directive**函数

该函数应返回一个字符串数组。假如它返回了`["天气", "weather"]`，并且你未实现`parse`函数时，当接收到用户消息后，会判断消息内容是否等于"天气"或者"weather"，若相等，则会执行`user`或`parse`或`both`函数，若不相等，则会进行下一个命令的判断。

##### parse函数

上述`directive`函数无法实现自定义命令解析，比如想要获取 "天气 西安" 这一消息中的城市，则需要使用该函数手动处理，该函数的返回值信息会赋给`data`属性，从而可供其他函数访问使用。**警告：**若提供了该函数，则不会再使用`directive`函数进行命令处理。



#### 处理函数：

##### user函数

提供该函数表示当前命令支持用户与机器人直接对话时的场景。

##### group函数

提供该函数表示当前命令支持处理群组聊天的消息内容。

##### both函数

当你的命令处理逻辑针对用户和群组比较相似时，同时提供`user`和`group`函数会略微繁琐，则可使用该函数来处理。**警告：**若提供了该函数，则`use`和`group`函数会无效。

##### session函数

该函数的功能参见下方[session函数](#class-session)的描述。



#### 函数参数：

`parse`函数和上述的所有的处理函数的参数都是一个对象，该对象的属性内容如下（scope列描述了该属性存在于哪些函数，all表示每个函数都有该参数）：

| key             | type                                                         | description                                                  | scope                   |
| --------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ----------------------- |
| messages        | Messages                                                     | 二维数组形式表示的用户发来的消息                             | all                     |
| stringMessages  | string                                                       | 字符串形式表示的用户发来的消息 (实际就是`CQHelper.toTextString(messages)`) | all                     |
| requestBody     | any                                                          | 原始的http请求body数据，具体内容可查看HTTP插件文档。         | all                     |
| fromUser        | number\|null                                                 | 发送消息者的QQ，为null时表明是群内匿名消息                   | all                     |
| fromGroup       | number\|undefined                                            | 发送消息者所在的Q群，使用`user`函数时该值为undefined         | all                     |
| robot           | number                                                       | 消息处理机器人                                               | all                     |
| isAt            | boolean                                                      | 是否艾特了机器人                                             | group                   |
| messageFromType | MessageFromType                                              | 消息来自方：group值群聊, anonymous指群内匿名聊, user指独聊   | both                    |
| setEnd          | () => Promise<void>                                          | 异步函数，设置会话上下文结束                                 | session                 |
| historyMessages | Record<string, Messages>                                     | 一个对象，保存了历史会话消息，其中key的值为`group`或`user`和`setNext`指定的名称 | session                 |
| setNext         | (sessionName: string, expireSeconds?: number) => Promise<void> | 异步函数，设置下一个需要执行的session函数                    | user,group,both,session |

#### 函数返回值：



##### parse函数

- 无返回值或是返回了`undefined`：表示用户消息不满足该命令的处理条件
- 其他任意类型的值：该值可通过`this.data`属性获取到，一般用在user`或`parse`函数中

##### 处理函数

- 无返回值或是返回了`undefined`：表示处理完毕，但不返回任何消息
- `{atSender:boolean, content: string}`：为一个对象时，`atSender`表示是否艾特发送者(仅群聊有效)，`content`为响应内容
- `string[]`：表示连续响应多条消息
- `string`：表示响应一条不艾特发送者的消息



#### 装饰器：

##### include( number[] )

可用于`group`和`user`函数，表示只有这些QQ群/QQ号才可以触发该命令：

```js
@include([ 12312, 21223 ])
user() {} //只有QQ为为它俩的用户可触发该命令

@include([ 3423344 ])
group() {} // 只有QQ群号为它的群可触发该命令
```



##### exclude( number[] )

可用于`group`和`user`函数，表示这些QQ群/QQ号不能触发该命令。**同时使用`include`和`exclude`会报错。**

```js
@exclude([ 12312, 21223 ])
user() {} // 除了上述两位QQ用户不能触发该命令，其他用户可触发

@include([ 3333 ])
group() {} // 只有群号为3333的群可触发该命令
```



##### trigger( triggerType )

可用于`group`和`both`函数，表示命令触发方式，可赋值为：

- `TriggerType.at` (默认值)：用户必须艾特机器人并发送消息方可触发命令
- `TriggerType.noAt`：用户之间在群内发送消息可触发命令，艾特机器人即使命令正确也不会触发
- `TriggerType.both`：艾特或者不艾特机器人都可触发命令

```js
@trigger(TriggerType.noAt)
group() {}
```

##### scope( triggerScope )

可用于`group`和`both`函数，表示什么身份的用户可触发该命令，可赋值为：

- `TriggerScope.all` (默认值)：所有用户都可触发
- `TriggerScope.owner`：仅群主可触发
- `TriggerScope.admin`：仅管理员可触发
- `TriggerScope.member`：仅普通成员可触发
- 使用或运算`|`产生组合值：比如`TriggerScope.owner | TriggerScope.admin`表示群主和管理员可触发

```js
@trigger(TriggerScope.all)
group() {}

```



### Class CQHelper

一个用来处理消息数组的工具类，提供了多种静态方法。该方法接收`messages`作为参数，该参数可在`parse`、`user`、`group`、`sessionXX`等函数参数中获取到。

#### static removeAt(messages: Messages): Messages

移除消息数组的艾特语句

#### static isAt(robotQQ: number, messages: Messages): boolean

判断消息数组是否含有艾特robotQQ的语句

#### static toTextString(messages: Messages, removeAt?: boolean): string

将消息数组转换为字符串形式，特殊形式的信息则会变成[CQ码](https://docs.cqp.im/manual/cqcode/)形式。



### Class HttpPlugin

- [ ] **TODO: 完善API接口**

该类用于主动调用[HTTP插件提供的API](https://cqhttp.cc/docs/#/API?id=api-列表)。目前该框架只默认处理了消息发送场景，在业务编写中若需其他接口则可使用该类进行调用。

#### constructor(endpoint: string, config?: PluginConfig)

| key      | type         | description        | optional |
| -------- | ------------ | ------------------ | -------- |
| endpoint | string       | HTTP插件的运行地址 |          |
| config   | PluginConfig | 插件配置信息       | optional |

PluginConfig：一个对象，包含如下属性

| key         | type   | description                                                | optional |
| ----------- | ------ | ---------------------------------------------------------- | -------- |
| accessToken | string | 须和HTTP插件配置文件值保持一致。在调用API时会验证该token。 | optional |

该类提供的实例方法名称是[HTTP插件文档](https://cqhttp.cc/docs/#/API?id=api-列表)提供API的驼峰式命名，方法的返回值是resolve值为json对象的promise，具体值等同于HTTP插件文档所列。

目前提供了如下接口的实现：

#### sendPrivateMsg(personQQ: number, message: string, escape?: boolean)

#### sendGroupMsg(groupQQ: number, message: string, escape?: boolean)

#### getGroupList()

#### getGroupMemberList(groupQQ: number)

#### downloadImage(cqFile: string)



### Class Session

该类通过与redis搭配，可实现上下文功能。

#### constructor(redisClient: any)

该构造函数接收一个redisClient对象，其值可为来自[node redis](https://github.com/NodeRedis/node_redis)或[handy-redis](https://github.com/mmkal/handy-redis)包创建的client对象：

```js
import { RobotFactory, HttpPlugin, Session } from 'lemon-bot';
import { createHandyClient } from 'handy-redis';

const robot = RobotFactory.create({
  // ...
  session: new Session(createHandyClient())
});

```

#### 如何使用上下文功能？

通过在`create`函数里传入`session`参数(如上述代码所示)，即可开启使用session函数/上下文功能。

#### 什么是session函数？

session函数指的是以"session"单词开头的写在继承类里的函数，继承类里可以有任意多个session函数。

#### 如何使用session函数？

在`user`或`group`函数的参数中有个`setNext`属性。

在session函数的参数中有`setNext`和`setEnd`两个属性。

- `setNext(name: string, expireSeconds?: number): Promise<void>` 

  参数一`name`的值为其他session函数的函数名或是省略"session"单词后的部分。

  参数二`expireSeconds`选填，表示会话过期时间，默认为5分钟。

  调用`setNext`后，当机器人再次接受到用户会话后，将直接执行`setNext`参数指定的函数。然后你可以继续调用`setNext`指定其他函数，每次执行session函数时，都可以获取到历史消息记录，从而进行自己的逻辑处理。

- `setEnd(): Promise<void>` 

  调用该函数表示结束当前会话上下文，当机器人再次接收到消息后，将会按照常规的解析流程处理：即先判断`directive`函数的返回值或者是执行`parse`函数，然后执行`group`或`user`函数。



现在我们改造下上面Demo中的代码，来演示session函数的使用，运行前请确保 ：

- redis处于运行状态并可访问其默认的6379端口
- 依赖安装：`npm i handy-redis`
- 修改`robot`字段为你当前酷Q登陆的账号

```js
import { Command, RobotFactory, HttpPlugin, Session } from "lemon-bot";
import { createHandyClient } from 'handy-redis';

class SimpleCommand extends Command {
  count = 3;

  directive() {
    return ["测试", "test"];
  }

  async user({ fromUser, setNext }) {
    await setNext('A');
    return "个数" + this.count;
  }

  async sessionA({ setNext }) {
    this.count--;
    await setNext("B", 10);
    return this.count;
  }

  async sessionB({ setNext }) {
    this.count--;
    await setNext("sessionC");
    return this.count;
  }

  async sessionC({ setNext, setEnd }) {
    this.count--;
    await setEnd();
    return "结束";
  }
}

const robot = RobotFactory.create({
  port: 8888,
  robot: 834679887,
  httpPlugin: new HttpPlugin("http://localhost:5700"),
  commands: [new SimpleCommand()],
  session: new Session(createHandyClient())
});
robot.start();

```

在命令行内输入`npx ts-node index.ts`启动机器人，然后开始向你的机器人发送信息：

- "测试"：会执行`user`函数，返回"个数3"
- "其他"：不执行任何内容
- "测试"：执行sessionA，返回"2"
- 10s内发送"测试"：返回"1"，
- "测试"：返回"结束"
- "测试"：将重新从`user`开始解析。(注意`count`的值已经变成了0)

在session存在期间，即使发给机器人的消息满足其他命令的处理条件，但并不会执行他们，知道session过期或结束。



### Class Logger

控制日志打印。

#### static enableDebug()

开启开发日志输出。

#### static disableDebug()

关闭开发日志输出。


Example：

```js
if (process.env.NODE_ENV === 'development')
	Logger.enableDebug();
else
    Logger.disableDebug();

```



## 安全指南

1. 尽可能避免HTTP插件的上报地址(即node服务器地址)可被外网访问，这会导致收到恶意请求。
2. 尽可能避免HTTP插件的运行地址可被公网访问，这会导致攻击者可进行API调用。若公网可访问，则应在配置文件中配置access_token并在代码的`HttpPlugin`实例中传入`accessToken`参数。添加后，当在调用API时会自动验证token值。



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

假如我们目前的`commands`数组是`[ new ACommand(), new BCommand() ]`，现在我希望当用户发来的消息都不满足这些命令的解析条件时，将它交由一个默认的处理命令：

1. 实现一个返回值始终为 **非`undefined`** 的`parse`函数：

   ```js
   export default class DefaultCommand extends Command {
       parse() {return true;}
       user(){
           return "默认返回"
       }
   }
   
   ```

2. 将该类的实例对象放在`commands`数组的**最后一位**：

   ```js
   const robot = new RobotFactory.create({
       // ...
       commands: [new ACommand(), new BCommand(), new DefaultCommand()]
   })
   
   ```

   

## 其他

该项目仍处于早期开发版，所以功能相对不是太过完善，也存在着诸多问题，希望大家踊跃提出issues。