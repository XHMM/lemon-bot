type Message<T extends string, D> = {
  type: T;
  data: D;
};

type TextMessage = Message<'text', { text: string }>;
type AtMessage = Message<'at', { qq: string }>; // at，若是手动复制的@xx是属于文本消息
type EmojiMessage = Message<'emoji', { id: string }>;
type SmallFaceMessage = Message<'sface', { id: string }>; // 小表情

type ImageMessage = Message<'image', { file: string; url: string }>; // 图片
type RecordMessage = Message<'record', { file: string }>; // 语音
type BigFaceMessage = Message<'bface', { id: string; p: string }>; // 大表情
type RichMessage = Message<'rich', { content: string }>; // 分享、王者组队等
type DiceMessage = Message<'dice', { type: string }>; // 投骰子
type RPSMessage = Message<'rps', { type: string }>; // 剪刀石头布
// 发送mp4 mp3及其他文件内容 是undefined，应该是需要pro版本
// 拍照界面的短视频 是text: '[视频]你的QQ暂不支持查看视频短片，请升级到最新版本后查看。'
// 红包 是text: '[QQ红包]请使用新版手机QQ查收红包。'

export type Messages = Array<
  | TextMessage
  | AtMessage
  | RichMessage
  | EmojiMessage
  | ImageMessage
  | RecordMessage
  | BigFaceMessage
  | SmallFaceMessage
  | DiceMessage
  | RPSMessage
>;

export class CQHelper {
  // 由于配置文件的post_message_format (https://cqhttp.cc/docs/4.11/#/Configuration?id=%E9%85%8D%E7%BD%AE%E9%A1%B9) 可能为两种形式，所以需要做兼容处理，统一转换为数组类型
  static normalizeMessage(messages: Messages | string): Messages {
    if (typeof messages === 'string') {
      // TODO: 当配置是string时直接抛出，后续看情况考虑是否提供自定义解析(源码参考位置 src/cqsdk/message.cpp)
      throw new Error('请设置HTTP插件的配置文件的post_message_format为array');
    } else return messages;
  }

  static removeAt(messages: Messages): Messages {
    return messages.filter(msg => msg.type !== 'at');
  }
  static isAt(robotQQ: number, messages: Messages): boolean {
    return messages.some(msg => msg.type === 'at' && +msg.data.qq === robotQQ);
  }

  static toTextString(messages: Messages, removeAt = false): string {
    const textTypes = ['text', 'emoji', 'sface'];
    if (!removeAt) textTypes.push('at');
    const text = messages
      .filter(msg => textTypes.includes(msg.type))
      .map(msg => {
        if (msg.type === 'text') return CQHelper.escapeTextMessage(msg).data.text;
        if (msg.type === 'at') return `[CQ:at,qq=${msg.data.qq}]`;
        if (msg.type === 'emoji') return `[CQ:emoji,id=${msg.data.id}]`;
        if (msg.type === 'sface') return `[CQ:bface,id=${msg.data.id}]`;
      })
      .join('')
      .trim();
    return text;
  }

  // 当用户发送的文本信息是比如 [CQ:emoji,id=128562]，若不转义则会被当做emoji表情而不是一个普通文本
  static escapeTextMessage(message: TextMessage): TextMessage {
    const map = {
      "&": "&amp;",
      "[": "&#91;",
      "]": "&#93;"
    }
    const escapedText = message.data.text.split('').map(char => {
      if(char in map) return map[char];
      return char;
    }).join('');
    return {
      type: 'text',
      data: {
        text: escapedText
      }
    }

  }
}
