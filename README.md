<h1>🍋 Lemon-Bot</h1>

一个基于酷Q和CoolQ HTTP API插件的QQ机器人Nodejs开发框架。

- 支持命令匹配、命令解析
- 支持多机器人
- 支持会话上下文功能


## 准备

1. 安装 [nodejs](https://nodejs.org/en/download/) (该框架基于v10.16.3版本进行开发与测试)

2. 安装 酷Q和HTTP插件：

   - Windows下：
     1. 前往酷Q的[版本发布](https://cqp.cc/b/news)页面下载（Air为免费版，Pro为收费版），下载后解压启动`CAQ.exe`或`CQP.exe`并登陆你的QQ机器人账号
     2. 查看CoolQ HTTP API插件的[文档页面](https://cqhttp.cc/docs/)中的"手动安装"部分的教程进行插件安装
   - Linux/MacOS下：
     1. 查看CoolQ HTTP API插件的[文档页面](https://cqhttp.cc/docs/)中的"使用Docker"部分的教程进行安装

3. 配置HTTP插件：每个账号的配置文件存放路径一般为`/path/to/酷Q/data/app/io.github.richardchien.coolqhttpapi/config/QQ号.json`，也可能是`.ini`格式的文件。下面均以`.json`格式说明（详细配置说明见[文档](https://cqhttp.cc/docs/#/Configuration?id=配置项)）：

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

4. 在命令行运行 `npm i lemon-bot`

5. 若要使用session功能，则需要安装 [redis](https://redis.io/download)

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
  directive(): string[] {
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

**在运行该代码前，请保证酷Q和HTTP插件处于运行状态，并安装上面进行了正确配置。然后请修改上述`robot`字段为你自己登陆的机器人QQ，**  然后在命令行内输入`npx ts-node index.ts`即可启动机器人。

现在用你的QQ向机器人发送 "测试" 或 "test" 文本，会发现机器人返回了 "你好呀[你的QQ号]"。若要测试机器人在群里的表现，则将该机器人拉入群内，然后在群内发送"测试"或"test"文本，你会发现机器人连续返回了两条消息:  "触发群是[机器人所在Q群]" 和 "触发用户是[你的QQ号]"。



## API文档

### Class RobotFactory

该类用于机器人的创建。

#### static create(config: CreateParams): CreateReturn

`CreateParams`：一个对象，接受如下参数

| key        | type       | description                                            | optional |
| ---------- | ---------- | ------------------------------------------------------ | -------- |
| port       | number     | node服务器的运行端口                                   |          |
| robot      | number     | 机器人QQ号                                             |          |
| httpPlugin | HttpPlugin | HTTP插件实例                                           |          |
| commands   | Command[]  | 需要注册的命令                                         |          |
| session    | Session    | 传入该参数运行使用session函数                          | optional |
| secret     | string     | 须和HTTP插件配置文件值保持一致，用于对上报数据进行验证 | optional |
| context    | object     | 该属性可在Command类内被访问，默认值为null              | optional |

`CreateReturn`：一个对象，包含如下属性

| key   | type              | description |
| ----- | ----------------- | ----------- |
| start | ()=>Promise<void> | 启动机器人  |
| stop  | () => void        | 停止机器人  |



### Class Command

该类需要被继承使用，用来创建命令。下面将以继承类的角度进行描述：

#### 继承类的结构：

```typescript
// 导入基类
import { Command} from 'lemon-bot';
// 导入ts类型定义
import {ParseParams, ParseReturn, UserHandlerParams, GroupHandlerParams, SessionHandlerParams, HandlerReturn} from 'lemon-bot'

class MyCommand extends Command {
    // context属性可使用this.context形式访问
    
    // [下面的directive函数和parse函数必须至少提供一个]
    // 该函数返回的数组元素会和用户消息进行相等性匹配，匹配成功则会使用下面的user/group函数进行处理
    directive(): string[]
    // 上述函数无法实现自定义命令解析，若需要手动解析则须提供该函数。若提供了该函数，则不会再使用上述函数进行命令处理。
    // 当该函数无返回值或是返回了undefined，表示接受到的消息不符合该命令，此时会继续匹配下一个命令。若返回了非undefined值，比如是自己解析得到的参数信息，该信息可以在下面的user和group中获取到。
    parse(params: ParseParams): ParseReturn

	// [下面的user函数和group函数必须至少提供一个]
	// 提供该函数表示该命令支持用户与机器人直接对话时触发
	user(params: UserHandlerParams): HandlerReturn
	// 提供该函数表示该命令支持在群组聊天内被触发
	group(params: GroupHandlerParams): HandlerReturn
	
    // [下面的函数都是以session开头，可提供任意多个，从而可以实现上下文功能]
    sessionA(params: SessionParams): HandlerReturn
	sessionB(params: SessionParams): HandlerReturn
}
```

#### 装饰器：

```js
// 可用于group和user函数。表示只有这些QQ群/QQ号才可以触发该命令
@include( number[] )

// 可用于group和user函数，表示这些QQ群/QQ号不能触发该命令
// 若同时使用了include和exclude，则只有exclude会生效
@exclude( number[] )

// 可用于group函数，表示命令触发方式。默认是必须艾特机器人并发送消息。
// 可赋值为TriggerType.at TriggerType.noAt TriggerType.both
@trigger( triggerType )
```



### Class CQHelper

一个用来处理消息数组的工具类，提供了多种静态方法。该方法接收`messages`作为参数，该值可在`parse`、`user`、`group`、`sessionX`等函数中获取到。

#### static removeAt(messages: Messages): Messages

移除消息数组的艾特语句

#### static isAt(robotQQ: number, messages: Messages): boolean

判断消息数组是否含有艾特robotQQ的语句

#### static toTextString(messages: Messages, removeAt?: boolean): string

将消息数组转换为字符串形式，特殊形式的信息则会变成[CQ码](https://docs.cqp.im/manual/cqcode/)形式。



### Class HttpPlugin

- [ ] **TODO: 完善API接口**

该类用于调用[HTTP插件提供的API](https://cqhttp.cc/docs/#/API?id=api-列表)。该框架默认只处理了消息发送的场景，若需其他接口则可使用该类进行调用。

#### constructor(endpoint: string, config?: PluginConfig)

| key      | type         | description        | optional |
| -------- | ------------ | ------------------ | -------- |
| endpoint | string       | HTTP插件的运行地址 |          |
| config   | PluginConfig | 插件配置信息       | optional |

PluginConfig：一个对象，包含如下属性

| key         | type   | description                                                | optional |
| ----------- | ------ | ---------------------------------------------------------- | -------- |
| accessToken | string | 须和HTTP插件配置文件值保持一致。在调用API时会验证该token。 | optional |

该实例对象目前支持如下API，每个API都返回resolve值为一个json对象的promise，具体值等同于HTTP插件文档所列：

- sendPrivateMsg(personQQ: number, message: string, escape?: boolean): Promise<SendPrivateMsgResponse>
- sendGroupMsg(groupQQ: number, message: string, escape?: boolean): Promise<SendGroupMsgResponse>
- getGroupList(): Promise<GetGroupListResponse>
- getGroupMemberList(groupQQ: number): Promise<GetGroupMemberListResponse>
- downloadImage(cqFile: string): Promise<GetImageResponse>



### Class Session

该类通过与redis搭配，从而可实现上下文功能。

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

通过在`create`函数里传入`session`参数，即可开启使用session函数的功能：

#### 什么是session函数？

session函数指的是以"session"单词开头的写在继承类里的函数。继承类里可以有任意多个session函数。

#### 如何使用session函数？

在`user`或`group`函数的参数中有个`setNext`属性。

在session函数的参数中有`setNext`和`setEnd`两个属性。

- `setNext(name: string, expireSeconds?: number): void` 

  参数一`name`的值为其他session函数的函数名或是省略"session"单词后的部分，参数二`expireSeconds`选填，表示会话过期时间，默认为5分钟。调用`setNext`后，当机器人再次接受到用户会话后，将直接执行`setNext`参数指定的函数。然后你可以继续调用`setNext`指定其他函数，每次执行session函数时，都可以获取到历史消息记录，从而进行自己的逻辑处理。

- `setEnd(): void` 

  调用该函数表示结束当前会话上下文，当机器人再次接收到消息后，将会按照常规的解析流程处理：即先判断`directive`函数的返回值或者是执行`parse`函数，然后执行`group`或`user`函数。



现在我们改造下上面Demo中的代码，来演示session函数的使用，运行前请确保 ：

- **你的redis处于运行状态**，下述代码将连接redis的默认6379端口
- 依赖安装：`npm i handy-redis`
- 修改`robot`为你当前酷Q登陆的账号

```js
import { Command, RobotFactory, HttpPlugin, Session } from "lemon-bot";
import { createHandyClient } from 'handy-redis';

class SimpleCommand extends Command {
  count = 3;

  directive(): string[] {
    return ["测试", "test"];
  }

  user({ fromUser, setNext }) {
    setNext('A');
    return "个数" + this.count;
  }

  sessionA({ setNext }) {
    this.count--;
    setNext("B", 10);
    return this.count;
  }

  sessionB({ setNext }) {
    this.count--;
    setNext("sessionC");
    return this.count;
  }

  sessionC({ setNext, setEnd }) {
    this.count--;
    setEnd();
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

在session存在期间，即使发给机器人的消息满足其他命令的处理条件，但并不会执行他们，知道session过期或结束



## 安全指南

1. 尽可能避免HTTP插件的上报地址(即node服务器地址)可被外网访问，这会导致收到恶意请求。

2. 尽可能避免HTTP插件的运行地址可被公网访问，这会导致攻击者可进行API调用。若公网可访问，则应在配置文件中配置access_token并在代码的`HttpPlugin`实例中传入`accessToken`参数。添加后，当在调用API时会自动验证token值。



## Recipes

### 1. 文件目录如何组织？

建议使用如下结构：

​	+*--* commands  
​	|   +-- SearchQuestionCommand.ts  
​	|   +-- HelpCommand.ts      

​	|   +-- WordCommand.ts  

​	+-- index.ts

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