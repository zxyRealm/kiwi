/**
 * @author linhuiw
 * @desc 工具方法
 */
import * as path from 'path';
import * as _ from 'lodash';
import * as fs from 'fs';
import { PROJECT_CONFIG, KIWI_CONFIG_FILE } from './const';
import translate, { parseMultiple, Options } from 'google-translate-open-api'
import * as ts from 'typescript'
import { readFiles } from './extract/file'
import * as slash from 'slash2';

const xlsx = require('node-xlsx').default

const log = console.log
const chalk = require('chalk')

// 查询指定文件
function lookForFiles(dir: string, fileName: string): string {
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
    } else if (info.isFile() && file === fileName) {
      return currName;
    }
  }
}

function readFile (filename: string) {
  return fs.readFileSync(filename, { encoding: 'utf8' })
}

/**
 * 获得项目配置信息
 */
function getProjectConfig() {
  const rootDir = path.resolve(process.cwd(), `./`);
  const configFile = lookForFiles(rootDir, KIWI_CONFIG_FILE);
  let obj = PROJECT_CONFIG.defaultConfig;

  if (configFile && fs.existsSync(configFile)) {
    obj = _.merge(obj, JSON.parse(fs.readFileSync(configFile, 'utf8')));
  }
  return obj;
}

/**
 * 获取语言资源的根目录
 */
function getKiwiDir() {
  const config = getProjectConfig();
  if (config) {
    return config.kiwiDir;
  }
}

/**
 * 获取对应语言的目录位置
 * @param lang
 */
function getLangDir(lang) {
  const { kiwiDir, srcLang } = getProjectConfig();
  return path.resolve(kiwiDir, lang || srcLang);
}

/**
 * 深度优先遍历对象中的所有 string 属性，即文案
 */
function traverse(obj, cb) {
  function traverseInner(obj, cb, path) {
    _.forEach(obj, (val, key) => {
      if (typeof val === 'string') {
        cb(val, [...path, key].join('_'));
      } else if (typeof val === 'object' && val !== null) {
        traverseInner(val, cb, [...path, key]);
      }
    });
  }

  traverseInner(obj, cb, []);
}

/**
 * 获取所有文案
 */
function getAllMessages(lang?: string, filter = (message: string, key: string) => true) {
  const CONFIG = getProjectConfig();
  lang = lang || CONFIG.srcLang
  const srcLangDir = getLangDir(lang);
  // try {
  let files = readFiles(srcLangDir, /\.(js|ts)$/)
  return getAllData(files, filter)
}

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
    } else {
      throw e;
    }
  };
  return asyncOperation().catch(handleReject);
}

/**
 * 设置超时
 * @param promise
 * @param ms
 */
function withTimeout(promise, ms, text) {
  const timeoutPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject({
        text,
        message: `Promise timed out after ${ms} ms.`
      });
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]);
}


/*
 * 使用google翻译
 */
function translateText (text, toLang) {
  const CONFIG = getProjectConfig();
  const timeout = CONFIG.translateOptions.timeout
  const options: Options = {
    to: PROJECT_CONFIG.langMap[toLang] || 'en',
    ...CONFIG.translateOptions
  };
  const googleTranslate = translate;

  return withTimeout(
    new Promise((resolve, reject) => {
      googleTranslate(text, options).then(res => {
          let translatedText =  Array.isArray(res.data) ? res.data[0] : res.data
          if (Array.isArray(text)) {
            translatedText = parseMultiple(translatedText)
        }
        setTimeout(() => {
          resolve(translatedText)
        }, 500)
          // resolve(translatedText)
        }).catch(error => {
          log('translate error', chalk(error.message))
          reject(error)
        }
      );
    }),
    timeout,
    text
  );
}

function findMatchKey(langObj, text) {
  for (const key in langObj) {
    if (langObj[key] === text) {
      return key;
    }
  }

  return null;
}

function findMatchValue(langObj, key) {
  return langObj[key];
}

/**
 * 将对象拍平
 * @param obj 原始对象
 * @param prefix
 */
function flatten(obj, prefix = '') {
  var propName = prefix ? prefix + '_' : '',
    ret = {};
  for (var attr in obj) {
    if (_.isArray(obj[attr])) {
      var len = obj[attr].length;
      ret[attr] = obj[attr].join(',');
    } else if (typeof obj[attr] === 'object') {
      _.extend(ret, flatten(obj[attr], propName + attr));
    } else {
      ret[propName + attr] = obj[attr];
    }
  }
  return ret;
}

// 指定内容替换成占位符
// 目的是去除已经匹配到的中文 
function replaceOccupyStr(str: string, regexp: RegExp, replacement?: string) {
  return str && str.replace(regexp, (...arg) => {
    return arg[0].split('').map(() => replacement || 'A').join('')
  })
}

// 将文件读取后转换问 js 对象
function transformToObject(filename: string, filter?: Function): object {
  const code = readFile(filename)
  const ast = ts.createSourceFile('', code, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);
  const keysObject = {}
  function visit(node: ts.Node) {
    switch (node && node.kind) {
      case ts.SyntaxKind.PropertyAssignment: {
      /** 判断 Ts 中的字符串含有中文 */
        const {
          name,
          initializer
        }: { name; initializer } = node as ts.PropertyAssignment;
        if (!filter || (typeof filter === 'function' && filter(initializer.text, name.text))) {
          keysObject[name.text] = initializer.text
        }
        break;
      }
    }

    ts.forEachChild(node, visit);
  }
  ts.forEachChild(ast, visit);
  return keysObject 
}

function getAllData (files: Array<string>, filter = (...arg) => true) {
  if (!files) return {}
  return files.reduce((prev, curr) => {
    const dataObj = transformToObject(curr, filter)
    return {
      ...prev,
      ...dataObj
    }
  }, {})
}

// 读取 sheet 表中所有 key 值，默认第一列为 key
function readSheetData (filename) {
  if (!filename) return []
  const config = getProjectConfig()
  const { keyIndex, valueIndex } = { ...config.excelOptions }
  const sheets = xlsx.parse(filename)
  const keysObject = {}
  sheets.forEach(sheet => {
    const { data } = sheet
    data.slice(1).forEach(row => {
      if (keysObject[row[keyIndex]] !== undefined) {
        console.error(`${keysObject[row[keyIndex]]} key 已存在`)
      }
      keysObject[row[keyIndex]] = row[valueIndex]
    })
  })
  return keysObject
}

// 获取项目 package.json 总 version 信息
function getProjectVersion() {
  const packageFilePath = `${slash(process.cwd())}/package.json`
  if (fs.existsSync(packageFilePath)) {
    return JSON.parse(fs.readFileSync(packageFilePath, { encoding: 'utf8'})).version
  } else {
    return ''
  }
}

/* TIP：不支持 vue 模板 html 内容中的忽略规则， 但可以通过将需要忽略的文案声明变量方式在js 文件中来注释
*@param {string} code 源码字符串
*@param {number} start 截取文本的其实位置
*/
function checkTextIsIgnore(code: string, start: number): boolean {
  return code && (code.substr(start - 20, 20).indexOf('/* ignore */') > -1 || code.substr(start - 20, 20).indexOf('<!-- ignore -->') > -1)
}

export {
  getKiwiDir,
  getLangDir,
  traverse,
  retry,
  withTimeout,
  getAllMessages,
  getProjectConfig,
  translateText,
  findMatchKey,
  findMatchValue,
  flatten,
  lookForFiles,
  replaceOccupyStr,
  transformToObject,
  getAllData,
  readSheetData,
  getProjectVersion,
  checkTextIsIgnore
};
