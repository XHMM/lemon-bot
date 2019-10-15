"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MessageFromType;
(function (MessageFromType) {
    MessageFromType["group"] = "group";
    MessageFromType["anonymous"] = "anonymous";
    MessageFromType["user"] = "user";
    MessageFromType["unhandled"] = "unhandled";
})(MessageFromType = exports.MessageFromType || (exports.MessageFromType = {}));
function getMessageFromTypeFromRequest(req) {
    var _a = req.body, message_type = _a.message_type, sub_type = _a.sub_type;
    if (message_type === 'group' && sub_type === 'normal')
        return MessageFromType.group;
    if (message_type === 'group' && sub_type === 'anonymous')
        return MessageFromType.anonymous;
    if (message_type === 'private' && sub_type === 'friend')
        return MessageFromType.user;
    return MessageFromType.unhandled;
}
exports.getMessageFromTypeFromRequest = getMessageFromTypeFromRequest;
function getMessageFromTypeFromNumbers(_a) {
    var fromUser = _a.fromUser, fromGroup = _a.fromGroup, robot = _a.robot;
    if (fromGroup && fromUser)
        return MessageFromType.group;
    if (fromGroup && !fromUser)
        return MessageFromType.anonymous;
    if (!fromGroup && fromUser)
        return MessageFromType.user;
    return MessageFromType.unhandled;
}
exports.getMessageFromTypeFromNumbers = getMessageFromTypeFromNumbers;
