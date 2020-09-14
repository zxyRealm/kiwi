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
import * as _ from 'lodash';

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

function exportMessages(file?: string, lang?: string) {
  const CONFIG = getProjectConfig();
  const langs = lang ? [lang] : CONFIG.distLangs;

  langs.map(lang => {
    const allMessages = getAllMessages(CONFIG.srcLang);
    const existingTranslations = getAllMessages(
      lang,
      (message, key) => CONFIG.srcLang === lang || !/[\u4E00-\u9FA5]/.test(allMessages[key]) || allMessages[key] !== message || allMessages[key] === undefined
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
    const sourceFile = file || `./export-${lang}`;
    const version = getProjectVersion()
    fs.writeFileSync(sourceFile, content);
    createXlsxFile(`export-${lang}_${version}`, messagesToTranslate)
    console.log(`Exported ${lang} ${messagesToTranslate.length} message(s).`);
  });
}

export { exportMessages };
