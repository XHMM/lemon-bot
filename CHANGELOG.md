# Change Log

## 0.3.1 (2019年10月20日)
### Fix bugs:
- 使用指令数组判断含艾特的消息时空格信息导致不成功

## 0.3.0 (2019年10月19日)
### Fix bugs:
- 修复了使用多机器人时仅首次被创建的机器人会生效

## 0.2.0 (2019年10月19日)
### Features:
- 新增了`both`函数
- 新增了`Logger`类用于日志输出控制
- 新增了`scope`修饰器
- 解析函数和处理函数的参数属性新增了`requestBody`

### Breaking changes:
- 群组命令的触发模式默认从`TriggerType.at`改为了`TriggerType.both`
- 解析函数和处理函数的参数属性的`messages`更名为了`message`
- 解析函数和处理函数的参数属性的`stringMessages`更名为了`rawMessage`
- `include`和`exclude`修饰器不可同时

### Enhancements:
- 修饰器添加了warning语句以帮助正确使用
- 日志信息更为全面
- 当命令类使用`setNext`设置了不存在的session函数时，不再抛错而是重置会话并打印警告信息