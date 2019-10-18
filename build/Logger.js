"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var signale_1 = require("signale");
var package_json_1 = require("../package.json");
var Logger = (function () {
    function Logger() {
    }
    Logger.setDebugLabel = function (label) {
        Logger.debugLogger = Logger.debugLogger.scope(Logger.prefix, label);
    };
    Logger.clearDebugLabel = function (label) {
        Logger.debugLogger = Logger.debugLogger.scope(Logger.prefix, label);
    };
    Logger.enableDebug = function () {
        Logger.debugLogger.enable();
    };
    Logger.disableDebug = function () {
        Logger.debugLogger.disable();
    };
    Logger.debug = function () {
        var _a;
        var msg = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            msg[_i] = arguments[_i];
        }
        (_a = Logger.debugLogger).debug.apply(_a, msg);
    };
    Logger.warn = function () {
        var _a;
        var msg = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            msg[_i] = arguments[_i];
        }
        (_a = Logger.logger).warn.apply(_a, msg);
    };
    Logger.error = function () {
        var _a;
        var msg = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            msg[_i] = arguments[_i];
        }
        (_a = Logger.logger).error.apply(_a, msg);
    };
    Logger.prefix = package_json_1.name;
    Logger.debugLogger = new signale_1.Signale({
        scope: Logger.prefix,
        types: {
            debug: {
                badge: '',
                label: 'debug',
                color: 'green',
            },
        },
    });
    Logger.logger = new signale_1.Signale({
        scope: Logger.prefix,
        types: {
            warn: {
                badge: '',
                label: 'warn',
                color: 'yellow',
            },
            error: {
                badge: '',
                label: 'error',
                color: 'red',
            },
        },
    });
    return Logger;
}());
exports.Logger = Logger;
