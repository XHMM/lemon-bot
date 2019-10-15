"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@xhmm/utils");
var Scope;
(function (Scope) {
    Scope["user"] = "user";
    Scope["group"] = "group";
    Scope["both"] = "both";
})(Scope = exports.Scope || (exports.Scope = {}));
var TriggerType;
(function (TriggerType) {
    TriggerType["at"] = "at";
    TriggerType["noAt"] = "noAt";
    TriggerType["both"] = "both";
})(TriggerType = exports.TriggerType || (exports.TriggerType = {}));
var Command = (function () {
    function Command() {
        if (this.directive)
            utils_1.assertType(this.directive, 'function');
        if (this.parse)
            utils_1.assertType(this.parse, 'function');
        if (!this.directive && !this.parse)
            throw new Error('请为Command的继承类提供directive函数或parse函数');
        var hasUserHandler = utils_1.getType(this.user) === 'function';
        var hasGroupHandler = utils_1.getType(this.group) === 'function';
        if (hasGroupHandler && hasUserHandler)
            this.scope = Scope.both;
        else {
            if (!hasUserHandler && !hasGroupHandler)
                throw new Error('为Command的继承类提供user函数或group函数');
            if (hasGroupHandler)
                this.scope = Scope.group;
            if (hasUserHandler)
                this.scope = Scope.user;
        }
    }
    Command.normalizeDirectives = function (cmd) {
        var defaultDirective = cmd.constructor.name + 'Default';
        if (typeof cmd.directive === 'function') {
            var directives = cmd.directive();
            if (utils_1.getType(directives) === 'array' || directives.length !== 0) {
                cmd.directives = directives;
                return;
            }
            else
                cmd.directives = [defaultDirective];
        }
        else
            cmd.directives = [defaultDirective];
    };
    return Command;
}());
exports.Command = Command;
function include(include) {
    return function (proto, name, descriptor) {
        if (name === 'group')
            proto.includeGroup = include;
        if (name === 'user')
            proto.includeUser = include;
    };
}
exports.include = include;
function exclude(exclude) {
    return function (proto, name, descriptor) {
        if (name === 'group')
            proto.excludeGroup = exclude;
        if (name === 'user')
            proto.excludeUser = exclude;
    };
}
exports.exclude = exclude;
function trigger(type) {
    return function (proto, name, descriptor) {
        proto.triggerType = type;
    };
}
exports.trigger = trigger;
