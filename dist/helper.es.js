/**
 * @axmine/helper v1.0.5
 * (c) 2019-2020 yocss https://github.com/yocss/axmine.git
 * License: MIT
 * Released on: Aug 21, 2020
 */

// format date
function formatDate(sec, format) {
    if (format === void 0) { format = 'y-m-d h:i'; }
    var d = new Date(sec * 1000);
    function expando(n) { return n < 10 ? '0' + n : n.toString(); }
    return format.replace(/\w/g, function (word) {
        var w = word.toLowerCase();
        return {
            y: d.getFullYear(),
            m: expando(d.getMonth() + 1),
            d: expando(d.getDate()),
            h: expando(d.getHours()),
            i: expando(d.getMinutes()),
            s: expando(d.getSeconds()),
            w: ['天', '一', '二', '三', '四', '五', '六'][d.getDay()]
        }[w] || '';
    });
}

// import { version } from '../package.json';
function getType(data) {
    return Object.prototype.toString.call(data).slice(8, -1).toLocaleLowerCase();
}

var Type;
(function (Type) {
    Type["localStorage"] = "localStorage";
    Type["sessionStorage"] = "sessionStorage";
    Type["cookie"] = "cookie";
})(Type || (Type = {}));
/**
 * store data
 */
var Store = /** @class */ (function () {
    function Store() {
    }
    Store.prototype.set = function (key, value, options) {
        if (options === void 0) { options = {}; }
        var option = Object.assign({ expireDays: 7, type: Type.localStorage }, options);
        var type = option.type;
        var expireDays = option.expireDays;
        return type === 'cookie' ? this.setCookie(key, value, expireDays) : this.setStorage(key, value, expireDays, type);
    };
    Store.prototype.get = function (key, type) {
        if (type === void 0) { type = Type.localStorage; }
        return type === 'cookie' ? this.getCookie(key) : this.getStorage(key, type);
    };
    Store.prototype.remove = function (key, type) {
        if (type === void 0) { type = Type.localStorage; }
        return type === 'cookie' ? this.removeCookie(key) : this.removeStorage(key, type);
    };
    Store.prototype.setStorage = function (key, value, expireDays, type) {
        if (expireDays === void 0) { expireDays = 7; }
        if (type === void 0) { type = Type.localStorage; }
        var bool = window && window[type] ? true : false;
        if (bool) {
            var t = expireDays > 0 ? (new Date().getTime()) * 1 + (expireDays * 86400000) : 0;
            var val = JSON.stringify({ v: value, t: t });
            window[type].setItem(key, val);
            bool = this.getStorage(key) === value;
        }
        return bool;
    };
    Store.prototype.getStorage = function (key, type) {
        if (type === void 0) { type = Type.localStorage; }
        var res = '';
        if (window && window[type]) {
            var v = window[type].getItem(key) || "{\"v\":'',\"t\":0}";
            var obj = JSON.parse(v);
            var now = new Date().getTime();
            res = obj.v;
            if (type === 'localStorage' && obj.t > 0 && now > obj.t) {
                res = '';
                this.removeStorage(key);
            }
        }
        return res;
    };
    Store.prototype.removeStorage = function (key, type) {
        if (type === void 0) { type = Type.localStorage; }
        var bool = window && window[type] ? true : false;
        if (bool) {
            window[type].removeItem(key);
            bool = this.getStorage(key) === '';
        }
        return bool;
    };
    Store.prototype.setCookie = function (key, value, expireDays) {
        if (expireDays === void 0) { expireDays = 7; }
        var bool = window && window.navigator.cookieEnabled;
        // if (!bool) { throw new Error('当前环境不支持 cookie 或 cookie 未启用') }
        if (bool) {
            var exdate = new Date();
            exdate.setDate(exdate.getDate() + expireDays);
            var expires = expireDays ? ";expires=" + exdate.toUTCString() : '';
            document.cookie = key + "=" + escape(value) + expires;
            bool = this.getCookie(key) === value;
        }
        return bool;
    };
    Store.prototype.getCookie = function (key) {
        var bool = window && window.navigator.cookieEnabled;
        // if (!bool) { throw new Error('当前环境不支持 cookie 或 cookie 未启用') }
        var res = '';
        if (bool) {
            if (document.cookie.length > 0) {
                var start = document.cookie.indexOf(key + '=');
                if (start >= 0) {
                    start = start + key.length + 1;
                    var end = document.cookie.indexOf(';', start);
                    if (end === -1)
                        end = document.cookie.length;
                    res = unescape(document.cookie.substring(start, end));
                }
            }
        }
        return res;
    };
    Store.prototype.removeCookie = function (key) {
        var bool = window && window.navigator.cookieEnabled;
        // if (!bool) { throw new Error('当前环境不支持 cookie 或 cookie 未启用') }
        if (bool) {
            bool = this.getCookie(key) ? true : false;
            if (bool) {
                this.setCookie(key, '', -1);
            }
        }
        return bool;
    };
    return Store;
}());

var supRules = ['required', 'len', 'min', 'max', 'enum', 'type', 'pattern', 'validator'];
function validate(rules, form) {
    // 遍历校验规则
    var result = { status: true, infos: [] };
    Object.keys(rules).forEach(function (k) {
        // 校验规则 类型为 array
        var rule = [].concat(rules[k]);
        // 等待被校验的值
        var val = form[k];
        for (var i = 0; i < rule.length; i++) {
            // 逐条进行校验
            var res = validRule(rule[i], val);
            if (!res.status) {
                // res.key = k
                result.infos.push({ message: res.message, key: k });
                break;
            }
        }
    });
    result.status = result.infos.length < 1;
    return result;
}
function validRule(rule, val) {
    var res = { status: true, message: rule.message || '' };
    var keys = Object.keys(rule);
    var valType = getType(val);
    // 1. 检查字段是否为必检字段
    var isRequired = false;
    // 2. 如果是必检字段，则检查值是否为空
    var isNull = /^\s+$/.test(val) || ['', undefined, null].includes(val);
    // 是否必检
    if (keys.includes('required') && rule['required']) {
        res.status = !isNull;
        isRequired = rule['required'] === true;
    }
    // 字段值为空并且为非必检时，直接通过验证
    var pass = !isRequired && isNull;
    // 字段必检或字段值不为空的时候，继续执行其他检查
    if (!pass && res.status) {
        for (var i = 0; i < keys.length; i++) {
            var ruleVal = rule[keys[i]];
            // 确保是在支持的校验规则之内
            if (supRules.includes(keys[i])) {
                // 检查其他字段是否合规
                switch (keys[i]) {
                    case 'len': {
                        res.status = val.length === ruleVal * 1;
                        break;
                    }
                    case 'min': {
                        if (valType === 'number') {
                            res.status = val >= ruleVal;
                        }
                        else {
                            res.status = val.length >= ruleVal;
                        }
                        break;
                    }
                    case 'max': {
                        if (valType === 'number') {
                            res.status = val <= ruleVal;
                        }
                        else {
                            res.status = val.length <= ruleVal;
                        }
                        break;
                    }
                    case 'enum': {
                        res.status = ruleVal.includes(val);
                        break;
                    }
                    case 'type': {
                        res.status = ruleVal.toLowerCase() === valType;
                        break;
                    }
                    case 'pattern': {
                        var reg = new RegExp(ruleVal);
                        res.status = reg.test(val);
                        break;
                    }
                    case 'validator': {
                        if (getType(ruleVal) === 'function') {
                            res.status = ruleVal(val);
                        }
                        else {
                            throw new Error('validator 不是一个函数');
                        }
                        break;
                    }
                }
            }
            // 只要有一项检查不合格，则退出当前循环
            if (!res.status) {
                break;
            }
        }
    }
    return res;
}

// time format
var index = {
    formatDate: formatDate,
    getType: getType,
    store: new Store(),
    validate: validate
};

export default index;
