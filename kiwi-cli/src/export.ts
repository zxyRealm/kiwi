/**
 * @author linhuiw
 * @desc 导出未翻译文件
 */
import { getProjectVersion } from './utils'
const xlsx = require('node-xlsx').default
const fs = require('fs-extra')

require('ts-node').register({
  compilerOptions: {
    module: 'commonjs'
  }
});
import { tsvFormatRows } from 'd3-dsv';
import { getAllMessages, getProjectConfig } from './utils';
import { DOUBLE_BYTE_REGEX } from './const'
import * as _ from 'lodash';
import { importMessages } from './import';

const sheetHeader = (lang?: string) => {
  return [
    'key',
     lang || '原文',
    '译文'
  ]
}
// 根据原文件目录结构生成新文件目录
function createXlsxFile (filename, sheetData) {
  const data = [ sheetHeader() ]
  const newRootDir = '.'
  if (Array.isArray(sheetData)) {
    data.push(...sheetData)
  } else {
    Object.keys(sheetData).forEach(key => {
      if (key) {
        data.push([key, sheetData[key]])
      }
    })
  }
  
  const buffer = xlsx.build([{ data }], { '!cols': [{ wch: 30 }, { wch: 50 }, { wch: 30 }] }
  )
  const filePath = `${newRootDir}/${filename}.xlsx`
  fs.outputFileSync(filePath, buffer)
}

// 导出未翻译的 key: value 值
function exportMessages(file?: string, lang?: string) {
  const CONFIG = getProjectConfig();
  const langs = lang ? [lang] : CONFIG.distLangs;
  const allMessages = getAllMessages(CONFIG.srcLang);
  // 默认判断中文
  const zhCnMessages = getAllMessages(CONFIG.zhLang)
  langs
    .filter(item => ![CONFIG.srcLang, CONFIG.zhLang].includes(item))
    .map(l => {
    const existingTranslations = getAllMessages(
      l,
      (message, key) => {
        // 非中文语言包，value 值 和中文一致时视为当前语言未翻译
        const unTranslateMsg = zhCnMessages[key] !== message
        // 源语言包 value 值和其他语言 value 一致的 key 视为未翻译内容
        const unOriginTranslateMsg  = allMessages[key] !== message
        return (l !== CONFIG.zhLang && DOUBLE_BYTE_REGEX.test(allMessages[key])) || (unTranslateMsg && unOriginTranslateMsg) || allMessages[key] === undefined
      }
    );
    const messagesToTranslate = Object.keys(allMessages)
      .filter(key => !existingTranslations.hasOwnProperty(key))
      .map(key => {
        let message = allMessages[key];
        message = JSON.stringify(message).slice(1, -1);
        return [key, message];
      });

    if (messagesToTranslate.length === 0) {
      console.log('All the messages have been translated.');
      return;
    }

    const content = tsvFormatRows(messagesToTranslate);
    const sourceFile = file || `./export-${l}.txt`;
    const version = getProjectVersion()
    fs.writeFileSync(sourceFile, content);
    createXlsxFile(`export-${l}_${version}`, messagesToTranslate)
    console.log(`Exported ${l} ${messagesToTranslate.length} message(s).`);
  });
}

export { exportMessages };
