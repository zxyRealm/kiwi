"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceOccupyStr = exports.lookForFiles = exports.flatten = exports.findMatchValue = exports.findMatchKey = exports.translateText = exports.getProjectConfig = exports.getAllMessages = exports.withTimeout = exports.retry = exports.traverse = exports.getLangDir = exports.getKiwiDir = void 0;
/**
 * @author linhuiw
 * @desc 工具方法
 */
const path = require("path");
const _ = require("lodash");
const fs = require("fs");
const const_1 = require("./const");
const google_translate_open_api_1 = require("google-translate-open-api");
function lookForFiles(dir, fileName) {
    const files = fs.readdirSync(dir);
    for (let file of files) {
        const currName = path.join(dir, file);
        const info = fs.statSync(currName);
        if (info.isDirectory()) {
            if (file === '.git' || file === 'node_modules') {
                continue;
            }
            const result = lookForFiles(currName, fileName);
            if (result) {
                return result;
            }
        }
        else if (info.isFile() && file === fileName) {
            return currName;
        }
    }
}
exports.lookForFiles = lookForFiles;
/**
 * 获得项目配置信息
 */
function getProjectConfig() {
    const rootDir = path.resolve(process.cwd(), `./`);
    const configFile = lookForFiles(rootDir, const_1.KIWI_CONFIG_FILE);
    let obj = const_1.PROJECT_CONFIG.defaultConfig;
    if (configFile && fs.existsSync(configFile)) {
        obj = _.merge(obj, JSON.parse(fs.readFileSync(configFile, 'utf8')));
    }
    return obj;
}
exports.getProjectConfig = getProjectConfig;
/**
 * 获取语言资源的根目录
 */
function getKiwiDir() {
    const config = getProjectConfig();
    if (config) {
        return config.kiwiDir;
    }
}
exports.getKiwiDir = getKiwiDir;
/**
 * 获取对应语言的目录位置
 * @param lang
 */
function getLangDir(lang) {
    const langsDir = getKiwiDir();
    return path.resolve(langsDir, lang);
}
exports.getLangDir = getLangDir;
/**
 * 深度优先遍历对象中的所有 string 属性，即文案
 */
function traverse(obj, cb) {
    function traverseInner(obj, cb, path) {
        _.forEach(obj, (val, key) => {
            if (typeof val === 'string') {
                cb(val, [...path, key].join('_'));
            }
            else if (typeof val === 'object' && val !== null) {
                traverseInner(val, cb, [...path, key]);
            }
        });
    }
    traverseInner(obj, cb, []);
}
exports.traverse = traverse;
/**
 * 获取所有文案
 */
function getAllMessages(lang, filter = (message, key) => true) {
    const srcLangDir = getLangDir(lang);
    let files = fs.readdirSync(srcLangDir);
    files = files.filter(file => file.endsWith('.ts') && file !== 'index.ts').map(file => path.resolve(srcLangDir, file));
    const allMessages = files.map(file => {
        const { default: messages } = require(file);
        const fileNameWithoutExt = path.basename(file).split('_')[0];
        const flattenedMessages = {};
        traverse(messages, (message, path) => {
            const key = fileNameWithoutExt + '_' + path;
            if (filter(message, key)) {
                flattenedMessages[key] = message;
            }
        });
        return flattenedMessages;
    });
    return Object.assign({}, ...allMessages);
}
exports.getAllMessages = getAllMessages;
/**
 * 重试方法
 * @param asyncOperation
 * @param times
 */
function retry(asyncOperation, times = 1) {
    let runTimes = 1;
    const handleReject = e => {
        if (runTimes++ < times) {
            return asyncOperation().catch(handleReject);
        }
        else {
            throw e;
        }
    };
    return asyncOperation().catch(handleReject);
}
exports.retry = retry;
/**
 * 设置超时
 * @param promise
 * @param ms
 */
function withTimeout(promise, ms) {
    const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(`Promise timed out after ${ms} ms.`);
        }, ms);
    });
    return Promise.race([promise, timeoutPromise]);
}
exports.withTimeout = withTimeout;
/**
 * 使用google翻译
 */
function translateText(text, toLang) {
    const CONFIG = getProjectConfig();
    const options = CONFIG.translateOptions || {};
    const googleTranslate = google_translate_open_api_1.default;
    return withTimeout(new Promise((resolve, reject) => {
        googleTranslate(text, Object.assign(Object.assign({}, options), { to: const_1.PROJECT_CONFIG.langMap[toLang] })).then(res => {
            let translatedText = res.data[0];
            if (Array.isArray(text)) {
                translatedText = google_translate_open_api_1.parseMultiple(translatedText);
            }
            resolve(translatedText);
        }).catch(error => {
            console.error('translate error', error);
            reject(error);
        });
    }), 5000);
}
exports.translateText = translateText;
function findMatchKey(langObj, text) {
    for (const key in langObj) {
        if (langObj[key] === text) {
            return key;
        }
    }
    return null;
}
exports.findMatchKey = findMatchKey;
function findMatchValue(langObj, key) {
    return langObj[key];
}
exports.findMatchValue = findMatchValue;
/**
 * 将对象拍平
 * @param obj 原始对象
 * @param prefix
 */
function flatten(obj, prefix = '') {
    var propName = prefix ? prefix + '_' : '', ret = {};
    for (var attr in obj) {
        if (_.isArray(obj[attr])) {
            var len = obj[attr].length;
            ret[attr] = obj[attr].join(',');
        }
        else if (typeof obj[attr] === 'object') {
            _.extend(ret, flatten(obj[attr], propName + attr));
        }
        else {
            ret[propName + attr] = obj[attr];
        }
    }
    return ret;
}
exports.flatten = flatten;
// 指定内容替换成占位符
// 目的是去除已经匹配到的中文 
function replaceOccupyStr(str, regexp, replacement) {
    return str && str.replace(regexp, (...arg) => {
        return arg[0].split('').map(() => replacement || 'A').join('');
    });
}
exports.replaceOccupyStr = replaceOccupyStr;
//# sourceMappingURL=utils.js.map