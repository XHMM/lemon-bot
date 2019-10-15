declare type Message<T extends string, D> = {
    type: T;
    data: D;
};
declare type TextMessage = Message<'text', {
    text: string;
}>;
declare type AtMessage = Message<'at', {
    qq: string;
}>;
declare type EmojiMessage = Message<'emoji', {
    id: string;
}>;
declare type SmallFaceMessage = Message<'sface', {
    id: string;
}>;
declare type ImageMessage = Message<'image', {
    file: string;
    url: string;
}>;
declare type RecordMessage = Message<'record', {
    file: string;
}>;
declare type BigFaceMessage = Message<'bface', {
    id: string;
    p: string;
}>;
declare type RichMessage = Message<'rich', {
    content: string;
}>;
declare type DiceMessage = Message<'dice', {
    type: string;
}>;
declare type RPSMessage = Message<'rps', {
    type: string;
}>;
export declare type Messages = Array<TextMessage | AtMessage | RichMessage | EmojiMessage | ImageMessage | RecordMessage | BigFaceMessage | SmallFaceMessage | DiceMessage | RPSMessage>;
export declare class CQHelper {
    static normalizeMessage(messages: Messages | string): Messages;
    static removeAt(messages: Messages): Messages;
    static isAt(robotQQ: number, messages: Messages): boolean;
    static toTextString(messages: Messages, removeAt?: boolean): string;
    static escapeTextMessage(message: TextMessage): TextMessage;
}
export {};
