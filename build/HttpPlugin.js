"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var node_fetch_1 = require("node-fetch");
var signale_1 = require("signale");
var utils_1 = require("@xhmm/utils");
var APIList;
(function (APIList) {
    APIList["send_private_msg"] = "send_private_msg";
    APIList["send_group_msg"] = "send_group_msg";
    APIList["get_group_list"] = "get_group_list";
    APIList["get_group_member_list"] = "get_group_member_list";
    APIList["get_image"] = "get_image";
})(APIList || (APIList = {}));
var HttpPluginError = (function (_super) {
    __extends(HttpPluginError, _super);
    function HttpPluginError(apiName, code, message) {
        var _this = _super.call(this, "api name:" + apiName + ", error message:" + message) || this;
        _this.name = _this.constructor.name;
        _this.apiName = apiName;
        _this.code = code;
        return _this;
    }
    return HttpPluginError;
}(Error));
var HttpPlugin = (function () {
    function HttpPlugin(endpoint, config) {
        this.logger = new signale_1.Signale({
            scope: 'coolq-http-api',
        });
        this.endpoint = endpoint;
        this.config = config || {};
    }
    HttpPlugin.prototype.sendPrivateMsg = function (personQQ, message, escape) {
        if (escape === void 0) { escape = false; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getResponseData(APIList.send_private_msg, {
                            user_id: personQQ,
                            message: message,
                            auto_escape: escape,
                        })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    HttpPlugin.prototype.sendGroupMsg = function (groupQQ, message, escape) {
        if (escape === void 0) { escape = false; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getResponseData(APIList.send_group_msg, {
                            group_id: groupQQ,
                            message: message,
                            auto_escape: escape,
                        })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    HttpPlugin.prototype.getGroupList = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getResponseData(APIList.get_group_list)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    HttpPlugin.prototype.getGroupMemberList = function (groupQQ) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getResponseData(APIList.get_group_member_list, {
                            group_id: groupQQ,
                        })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    HttpPlugin.prototype.downloadImage = function (cqFile) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getResponseData(APIList.get_image, {
                            file: cqFile,
                        })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    HttpPlugin.prototype.getResponseData = function (api, queryObject) {
        return __awaiter(this, void 0, void 0, function () {
            var response, _a, status_1, retcode, data, reason, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        return [4, node_fetch_1.default(this.endpoint + "/" + api + "?" + utils_1.objectToQS(queryObject), {
                                headers: utils_1.conditionalObjectMerge({}, [
                                    this.config.accessToken !== undefined,
                                    {
                                        Authorization: "Bearer " + this.config.accessToken,
                                    },
                                ]),
                            })];
                    case 1:
                        response = _b.sent();
                        if (!(response.status === 200)) return [3, 3];
                        return [4, response.json()];
                    case 2:
                        _a = _b.sent(), status_1 = _a.status, retcode = _a.retcode, data = _a.data;
                        if (status_1 === 'ok' && retcode === 0)
                            return [2, data];
                        reason = '得去看coolq应用的运行日志(不是http插件哦)';
                        if (status_1 === 'failed') {
                            if (retcode === -23)
                                reason = "\u627E\u4E0D\u5230\u4E0E\u76EE\u6807QQ\u7684\u5173\u7CFB\uFF0C\u6D88\u606F\u65E0\u6CD5\u53D1\u9001";
                            if (retcode === -34)
                                reason = '机器人被禁言了';
                            if (retcode === -38)
                                reason = '接收者帐号错误或帐号不在该群组内';
                        }
                        return [2, Promise.reject(new HttpPluginError(api, retcode, "response data status is " + status_1 + ", reason is " + reason))];
                    case 3: return [2, Promise.reject(new HttpPluginError(api, -1, "fetch response status code is " + response.status))];
                    case 4: return [3, 6];
                    case 5:
                        e_1 = _b.sent();
                        throw new HttpPluginError(api, -1, e_1.message);
                    case 6: return [2];
                }
            });
        });
    };
    return HttpPlugin;
}());
exports.HttpPlugin = HttpPlugin;
