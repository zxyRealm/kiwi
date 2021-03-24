import { findTextInTs } from './extract/findChineseText';
import { getProjectConfig, getProjectVersion, readSheetData, prettierFile } from './utils'
import { getSpecifiedFiles, readFile, writeFile } from './extract/file';
import { createXlsxFile } from './export'
import * as _ from 'lodash';
import * as fs from 'fs'
import { tsvFormatRows } from 'd3-dsv';
const chalk = require('chalk')
const log = console.log;
const CONFIG = getProjectConfig();

const sourceString = "{{text(tips(link('查看默认图'),img({src: 'https://uniubi-front.oss-cn-hangzhou.aliyuncs.com/public/scrImage1Url.png', width: '148px', height: '148px'})), br(), '照片比例1:1，大小不得超过2M', br(), '文件格式支持jpg、jpeg、png', br(), '如：公司logo') }}"

// 导出中文 excel
function exportTextsExcel (allTexts) {
  // 构建 excel 数据结构
  const sheetData = [
    ['key', '中文']
  ]
  allTexts.length && allTexts.forEach((file) => {
    file.texts && file.texts.forEach((texts) => {
      sheetData.push([null, texts.text])
    })
  })
  const content = tsvFormatRows(sheetData)
  console.log('sheet data', sheetData)
  if (sheetData.length > 1) { 
    createXlsxFile(`export-json_${getProjectVersion() || ''}`, sheetData)
    fs.writeFileSync(`export-json.txt`, content);
    log(chalk.green(`excel 导出成功`))
  }
}

// 根据中文 json 文件，生成指定语言的其他语言文件
function updateOtherLangFile (allTexts, dir: string, excelFilePath: string, lang: string): void {
  // 读取语言 excel 生成 以中文为 key 的 map 对象
  const sheetData = readSheetData(excelFilePath);
  const prePath = dir.replace(/(.*)\/$/, '$1')
  console.log('pre path', prePath)
  allTexts.forEach((file) => {
    console.log('file', file)
    // 更新语言文件的文件名
    const newFileName = `${prePath}/${lang}${file.file.replace(prePath, '')}`
    let code = readFile(file.file)
    file.texts.forEach(text => {
      code = replaceInJson(code, text, sheetData[text.text])
    })
    console.log('file name', newFileName)
    writeFile(newFileName, prettierFile(code))
  })
  // 
}

// 替换 json 中的中文
function replaceInJson (code, arg, val) {
  const { start, end } = arg.range
  let finalReplaceVal = val
  console.log('replace text', code.slice(start, end))
  return `${code.slice(0, start)}${finalReplaceVal}${code.slice(end)}`;
}


// 扫描 json 文件中的中文文案
function ExtractJsonInText (dir: string, excelFilePath?: string, lang?: string) {
  const files = getSpecifiedFiles(dir, CONFIG.include);
  console.log('files', files)
  const filterFiles = files.filter(file => {
    return file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.vue') || file.endsWith('.js');
  });
  // 目录下所有中文文案
  const allTexts = filterFiles.reduce((pre, file) => {
    const code = readFile(file);
    const texts = findTextInTs(code, file, true);
    // 调整文案顺序，保证从后面的文案往前替换，避免位置更新导致替换出错
    const sortTexts = _.sortBy(texts, obj => -obj.range.start);
    
    if (texts.length > 0) {
      log(chalk.green(`${file} 发现中文文案 ${texts.length} 条`));
    }

    return texts.length > 0 ? pre.concat({ file, texts: sortTexts }) : pre;
  }, []);

  if (!allTexts.length) {
    return log(chalk.warn(`未发现中文文案`))
  }
  // 将中文导出到 excel
  !excelFilePath && exportTextsExcel(allTexts)
  // 扁平化后的数组列表
  if (fs.existsSync(excelFilePath)) {
    updateOtherLangFile(allTexts, dir, excelFilePath, lang)
  } else {
    log(chalk.red(`${excelFilePath} 文件不存在`))
  }
}

export default ExtractJsonInText;