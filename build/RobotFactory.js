"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@xhmm/utils");
var Command_1 = require("./Command");
var CQHelper_1 = require("./CQHelper");
var utils_2 = require("./utils");
var RobotFactory = (function () {
    function RobotFactory() {
    }
    RobotFactory.create = function (_a) {
        var _this = this;
        var port = _a.port, robot = _a.robot, httpPlugin = _a.httpPlugin, commands = _a.commands, _b = _a.session, session = _b === void 0 ? null : _b, _c = _a.secret, secret = _c === void 0 ? '' : _c, _d = _a.context, context = _d === void 0 ? null : _d;
        {
            var allDirectives = [];
            for (var _i = 0, commands_1 = commands; _i < commands_1.length; _i++) {
                var command = commands_1[_i];
                if (Object.getPrototypeOf(command.constructor) !== Command_1.Command)
                    throw new Error('请继承Command类并传入实例对象');
                Command_1.Command.normalizeDirectives(command);
                allDirectives.push.apply(allDirectives, command.directives);
            }
            if (utils_1.hasRepeat(allDirectives))
                throw new Error('所有的Command对象间的指令不能重复');
            if (context)
                utils_1.assertType(context, 'object');
            if (Object.keys(RobotFactory.commandsMap).includes(robot + ''))
                throw new Error('机器人已存在');
            console.info('\n');
            console.info("Robot " + robot + ":");
            if (session)
                console.info(" - [\u529F\u80FD] session\u51FD\u6570\u5904\u7406\u5DF2\u542F\u7528");
            else
                console.info(" - [\u529F\u80FD] session\u51FD\u6570\u5904\u7406\u672A\u5F00\u542F");
            for (var _e = 0, commands_2 = commands; _e < commands_2.length; _e++) {
                var command = commands_2[_e];
                console.info(" - [\u547D\u4EE4] \u6307\u4EE4\u96C6:" + command.directives.join(',') + "  \u89E3\u6790\u51FD\u6570:" + (command.parse ? '有' : '无') + "  \u4F5C\u7528\u57DF:" + command.scope + "  " + (command.scope === Command_1.Scope.user ? '' : "\u662F\u5426\u827E\u7279:" + (command.triggerType ? command.triggerType : Command_1.TriggerType.at)));
                command.context = context;
            }
            console.info('\n');
            RobotFactory.commandsMap[robot + ''] = {
                commands: commands,
                port: port,
                session: session,
                qq: robot,
            };
        }
        if (!Object.keys(RobotFactory.appsMap).includes(port + '')) {
            var express = require('express');
            var crypto_1 = require('crypto');
            var app = express();
            app.use(express.json());
            RobotFactory.appsMap[port + ''] = [app, 'idle'];
            app.post('/coolq', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var signature, hmac, test_1, messages, messageFromType, isGroupMessage, isAnonymousMessage, isUserMessage, userNumber, groupNumber, robotNumber, numbers, isAt, noSessionError, sessionData, _i, _a, command, sessionNames, setNext, setEnd, sessionHandlerParams, replyData, messageFromType_1, _b, _c, command, includeGroup, excludeGroup, includeUser, excludeUser, scope, directives, parse, user, group, triggerType, matchGroupScope, matchUserScope, canThisNumberUse, parsedData, baseInfo, replyData;
                var _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            if (+req.header('X-Self-ID') !== robot) {
                                console.info('[请求终止] 请求来源和当前机器人不符，不做处理');
                                res.end();
                                return [2];
                            }
                            if (secret) {
                                signature = req.header('X-Signature');
                                if (!signature)
                                    throw new Error('无X-Signature请求头，请确保HTTP插件的配置文件配置了secret选项');
                                signature = signature.split('=')[1];
                                hmac = crypto_1.createHmac('sha1', secret);
                                hmac.update(JSON.stringify(req.body));
                                test_1 = hmac.digest('hex');
                                if (test_1 !== signature) {
                                    console.info('[请求终止] 消息体与签名不符，结束');
                                    res.end();
                                    return [2];
                                }
                            }
                            messages = req.body.message && CQHelper_1.CQHelper.normalizeMessage(req.body.message);
                            messageFromType = utils_2.getMessageFromTypeFromRequest(req);
                            if (messageFromType === 'unhandled') {
                                console.info('[请求终止]  非聊天类消息，不做处理');
                                res.end();
                                return [2];
                            }
                            isGroupMessage = messageFromType === 'group';
                            isAnonymousMessage = messageFromType === 'anonymous';
                            isUserMessage = messageFromType === 'user';
                            userNumber = isAnonymousMessage ? null : req.body.sender.user_id;
                            groupNumber = req.body.group_id;
                            robotNumber = robot;
                            numbers = {
                                fromUser: userNumber,
                                fromGroup: groupNumber,
                                robot: robotNumber,
                            };
                            isAt = CQHelper_1.CQHelper.isAt(robot, messages);
                            noSessionError = function () {
                                throw new Error('未设置session参数，无法使用该函数');
                            };
                            sessionData = null;
                            if (!session) return [3, 2];
                            return [4, session.getSession(numbers)];
                        case 1:
                            sessionData = _e.sent();
                            _e.label = 2;
                        case 2:
                            if (!sessionData) return [3, 7];
                            _i = 0, _a = RobotFactory.commandsMap[robot].commands;
                            _e.label = 3;
                        case 3:
                            if (!(_i < _a.length)) return [3, 6];
                            command = _a[_i];
                            if (!sessionData.directives.includes(command.directives[0]))
                                return [3, 5];
                            sessionNames = Object.getOwnPropertyNames(command.__proto__)
                                .filter(function (item) { return item.startsWith('session') && item !== 'constructor'; })
                                .map(function (item) { return item.slice(7); });
                            if (!sessionNames.includes(sessionData.sessionName)) return [3, 5];
                            setNext = session
                                ? session.setSession.bind(session, numbers, {
                                    directives: sessionData.directives,
                                    historyMessages: __assign(__assign({}, sessionData.historyMessages), (_d = {}, _d[sessionData.sessionName] = messages, _d)),
                                })
                                : noSessionError;
                            setEnd = session ? session.removeSession.bind(session, numbers) : noSessionError;
                            sessionHandlerParams = __assign(__assign({ setNext: setNext,
                                setEnd: setEnd }, numbers), { messages: messages, historyMessages: sessionData.historyMessages });
                            replyData = command["session" + sessionData.sessionName].call(command, sessionHandlerParams);
                            messageFromType_1 = utils_2.getMessageFromTypeFromNumbers(numbers);
                            return [4, handleReplyData(res, replyData, {
                                    matchGroupScope: messageFromType_1 === utils_2.MessageFromType.group || messageFromType_1 === utils_2.MessageFromType.anonymous,
                                    matchUserScope: messageFromType_1 === utils_2.MessageFromType.user,
                                    userNumber: userNumber,
                                    groupNumber: groupNumber,
                                    httpPlugin: httpPlugin,
                                })];
                        case 4:
                            _e.sent();
                            console.info("[\u6D88\u606F\u5904\u7406] \u4F7F\u7528session" + sessionData.sessionName + "\u51FD\u6570\u5904\u7406\u5B8C\u6BD5");
                            return [2];
                        case 5:
                            _i++;
                            return [3, 3];
                        case 6:
                            res.end();
                            throw new Error("[\u6D88\u606F\u5904\u7406] Error:\u672A\u627E\u5230\u4E0E\u7F13\u5B58\u5339\u914D\u7684\u540D\u4E3A[session" + sessionData.sessionName + "}\u7684session\u51FD\u6570");
                        case 7:
                            _b = 0, _c = RobotFactory.commandsMap[robot].commands;
                            _e.label = 8;
                        case 8:
                            if (!(_b < _c.length)) return [3, 18];
                            command = _c[_b];
                            includeGroup = command.includeGroup, excludeGroup = command.excludeGroup, includeUser = command.includeUser, excludeUser = command.excludeUser, scope = command.scope, directives = command.directives;
                            parse = command.parse && command.parse.bind(command);
                            user = command.user && command.user.bind(command);
                            group = command.group && command.group.bind(command);
                            triggerType = command.triggerType || Command_1.TriggerType.at;
                            matchGroupScope = (scope === Command_1.Scope.group || scope === Command_1.Scope.both) && (isGroupMessage || isAnonymousMessage);
                            matchUserScope = (scope === Command_1.Scope.user || scope === Command_1.Scope.both) && isUserMessage;
                            if (!(matchGroupScope || matchUserScope)) return [3, 17];
                            canThisNumberUse = true;
                            if (matchGroupScope) {
                                if (triggerType === Command_1.TriggerType.at && !isAt)
                                    return [3, 17];
                                if (triggerType === Command_1.TriggerType.noAt && isAt)
                                    return [3, 17];
                                if (includeGroup && includeGroup.includes(groupNumber))
                                    canThisNumberUse = true;
                                if (excludeGroup && excludeGroup.includes(groupNumber))
                                    canThisNumberUse = false;
                            }
                            if (matchUserScope) {
                                if (includeUser && includeUser.includes(userNumber))
                                    canThisNumberUse = true;
                                if (excludeUser && excludeUser.includes(userNumber))
                                    canThisNumberUse = false;
                            }
                            if (!canThisNumberUse)
                                return [3, 17];
                            parsedData = null;
                            baseInfo = __assign({ directives: directives, messages: messages, httpPlugin: httpPlugin }, numbers);
                            if (!parse) return [3, 10];
                            return [4, parse(__assign({}, baseInfo))];
                        case 9:
                            parsedData = _e.sent();
                            if (typeof parsedData === 'undefined')
                                return [3, 17];
                            return [3, 11];
                        case 10:
                            if (!directives.includes(CQHelper_1.CQHelper.toTextString(CQHelper_1.CQHelper.removeAt(messages)))) {
                                return [3, 17];
                            }
                            _e.label = 11;
                        case 11:
                            command.data = parsedData || null;
                            replyData = void 0;
                            if (!(matchGroupScope && group)) return [3, 13];
                            return [4, group(__assign(__assign({}, baseInfo), { fromGroup: baseInfo.fromGroup, isAt: isAt, setNext: session
                                        ? session.setSession.bind(session, numbers, {
                                            directives: directives,
                                            historyMessages: {
                                                group: messages,
                                            },
                                        })
                                        : noSessionError }))];
                        case 12:
                            replyData = _e.sent();
                            console.info("[\u6D88\u606F\u5904\u7406] \u4F7F\u7528group\u51FD\u6570\u5904\u7406\u5B8C\u6BD5" + (typeof replyData === 'undefined' ? '(无返回值)' : ''));
                            _e.label = 13;
                        case 13:
                            if (!(matchUserScope && user)) return [3, 15];
                            return [4, user(__assign(__assign({}, baseInfo), { fromUser: baseInfo.fromUser, fromGroup: undefined, setNext: session
                                        ? session.setSession.bind(session, numbers, {
                                            directives: directives,
                                            historyMessages: {
                                                user: messages,
                                            },
                                        })
                                        : noSessionError }))];
                        case 14:
                            replyData = _e.sent();
                            console.info("[\u6D88\u606F\u5904\u7406] \u4F7F\u7528user\u51FD\u6570\u5904\u7406\u5B8C\u6BD5" + (typeof replyData === 'undefined' ? '(无返回值)' : ''));
                            _e.label = 15;
                        case 15: return [4, handleReplyData(res, replyData, {
                                matchGroupScope: matchGroupScope,
                                matchUserScope: matchUserScope,
                                userNumber: userNumber,
                                groupNumber: groupNumber,
                                httpPlugin: httpPlugin,
                            })];
                        case 16:
                            _e.sent();
                            return [2];
                        case 17:
                            _b++;
                            return [3, 8];
                        case 18:
                            res.end();
                            return [2];
                    }
                });
            }); });
        }
        function start() {
            return new Promise(function (resolve, reject) {
                var _a = RobotFactory.appsMap[port], app = _a[0], status = _a[1];
                if (status === 'idle') {
                    RobotFactory.appsMap[port][1] = 'listening';
                    app
                        .listen(port, function () {
                        resolve();
                        console.info("[\u666E\u901A\u65E5\u5FD7] http server listening on http://localhost:" + port + "/coolq\n");
                    })
                        .on('error', function (err) {
                        console.error(err);
                        reject(err);
                    });
                }
                else {
                    resolve();
                }
            });
        }
        function stop() {
            delete RobotFactory.commandsMap[robot + ''];
        }
        return {
            start: start,
            stop: stop,
        };
    };
    RobotFactory.commandsMap = {};
    RobotFactory.appsMap = {};
    return RobotFactory;
}());
exports.RobotFactory = RobotFactory;
function handleReplyData(res, replyData, deps) {
    return __awaiter(this, void 0, void 0, function () {
        var replyType, _i, _a, reply, str;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    replyType = utils_1.getType(replyData);
                    if (!(replyType === 'array')) return [3, 7];
                    _i = 0, _a = replyData;
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3, 6];
                    reply = _a[_i];
                    if (!deps.matchUserScope) return [3, 3];
                    return [4, deps.httpPlugin.sendPrivateMsg(deps.userNumber, reply.toString())];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    if (!deps.matchGroupScope) return [3, 5];
                    return [4, deps.httpPlugin.sendGroupMsg(deps.groupNumber, reply.toString())];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3, 1];
                case 6:
                    res.end();
                    return [2];
                case 7:
                    if (replyType === 'object') {
                        res.json({
                            at_sender: typeof replyData.atSender === 'boolean' ? replyData.atSender : false,
                            reply: replyData.content || 'Hi',
                        });
                        return [2];
                    }
                    else if (replyType === 'string') {
                        res.json({
                            at_sender: false,
                            reply: replyData,
                        });
                        return [2];
                    }
                    else {
                        str = replyData.toString();
                        if (str)
                            res.json({
                                at_sender: false,
                                reply: str,
                            });
                        else
                            res.end();
                        return [2];
                    }
                    _b.label = 8;
                case 8: return [2];
            }
        });
    });
}
