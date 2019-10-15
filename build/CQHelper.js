"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CQHelper = (function () {
    function CQHelper() {
    }
    CQHelper.normalizeMessage = function (messages) {
        if (typeof messages === 'string') {
            throw new Error('请设置HTTP插件的配置文件的post_message_format为array');
        }
        else
            return messages;
    };
    CQHelper.removeAt = function (messages) {
        return messages.filter(function (msg) { return msg.type !== 'at'; });
    };
    CQHelper.isAt = function (robotQQ, messages) {
        return messages.some(function (msg) { return msg.type === 'at' && +msg.data.qq === robotQQ; });
    };
    CQHelper.toTextString = function (messages, removeAt) {
        if (removeAt === void 0) { removeAt = false; }
        var textTypes = ['text', 'emoji', 'sface'];
        if (!removeAt)
            textTypes.push('at');
        var text = messages
            .filter(function (msg) { return textTypes.includes(msg.type); })
            .map(function (msg) {
            if (msg.type === 'text')
                return CQHelper.escapeTextMessage(msg).data.text;
            if (msg.type === 'at')
                return "[CQ:at,qq=" + msg.data.qq + "]";
            if (msg.type === 'emoji')
                return "[CQ:emoji,id=" + msg.data.id + "]";
            if (msg.type === 'sface')
                return "[CQ:bface,id=" + msg.data.id + "]";
        })
            .join('')
            .trim();
        return text;
    };
    CQHelper.escapeTextMessage = function (message) {
        var map = {
            "&": "&amp;",
            "[": "&#91;",
            "]": "&#93;"
        };
        var escapedText = message.data.text.split('').map(function (char) {
            if (char in map)
                return map[char];
            return char;
        }).join('');
        return {
            type: 'text',
            data: {
                text: escapedText
            }
        };
    };
    return CQHelper;
}());
exports.CQHelper = CQHelper;
