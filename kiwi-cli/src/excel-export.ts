const fs = require('fs-extra')
const path = require('path')
const slash = require('slash2');
const dirs = require('node-dir')
const xlsx = require('node-xlsx').default
import * as ts from 'typescript'
import { getProjectConfig } from './utils'
import * as chalk from 'chalk'
const log = console.log
function resolve (dir: string) {
  return path.resolve(__dirname, './', dir)
}

function readFile (filename: string) {
  return fs.readFileSync(filename, { encoding: 'utf8' })
}

// 统一表头格式
const sheetHeader = (lang?: string) => {
  return [
    'key',
     lang || '原文',
    '译文'
  ]
}
// 列宽设置
const sheetOptions = { '!cols': [{ wch: 30 }, { wch: 50 }, { wch: 30 }] }

interface nType {
  text: string
}
// 将文件读取后转换问 js 对象
function transformToObject(filename: string): object {
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
        } : { name; initializer } = node as ts.PropertyAssignment;
        console.log('node ---', node)
        keysObject[name.text] = initializer.text
        break;
      }
    }

    ts.forEachChild(node, visit);
  }
  ts.forEachChild(ast, visit);
  return keysObject
 
}

// 遍历语言包文件
function exportExcel (langDir?: string, lang?: string) {
  const CONFIG = getProjectConfig();
  langDir = langDir || CONFIG.kiwiDir
  const directory = fs.readdirSync(langDir)
  // 语言包目录深度
  const langDirLength:number = langDir.split('/').filter(i => i && i !== '.').length
  // 语言文件名称列表
  const excelList = directory.filter(dir => !/\.[a-zA-Z]+$/.test(dir))
  console.log('dir --', excelList)
  dirs.readFiles(langDir, {
    match: /\.js$/
  },
    (error, content, next) => {
      if (error) throw new Error(error)
      next()
    },
    (error, files) => {
      if (error) throw new Error(error)
      // 根据 locales 目录下的一级目录区分语言类型
      const langObj = {}
      
      console.log('all files', langDir)
      files.map(file => slash(file)).forEach(item => {
        // 语言包文件一级目录视为语言类型
        const langName = item.split('/')[langDirLength]
        // 是否是语言类型文件夹名，排除非文件夹
        const isLangDir = !/\.[a-zA-Z]+$/.test(langName)
        if (isLangDir) {
          langObj[langName] ? langObj[langName].push(item) : langObj[langName] = [item]
        }
      })
      Object.keys(langObj).forEach(key => {
        if (lang) {
          if (langObj[lang]) {
            const allData = getAllData(langObj[key], langDir)
            createXlsxFile(key, allData)
          } else {
            log(chalk.red(`${lang} 语言文件不存在，请从 ${excelList.join('|')} 中选取`))
          }
        } else {
          const allData = getAllData(langObj[key], langDir)
          createXlsxFile(key, allData)
        }
        
      })
  })
}

function getAllData (files, rootDir) {
  if (!files) return {}
  return files.reduce((prev, curr) => {
    const dataObj = transformToObject(curr)
    return {
      ...prev,
      ...dataObj
    }
  }, {})
}
// 根据原文件目录结构生成新文件目录
function createXlsxFile (filename, sheetData) {
  const data = [ sheetHeader() ]
  const newRootDir = './export-excel'
  Object.keys(sheetData).forEach(key => {
    if (key) {
      data.push([key, sheetData[key]])
    }
  })
  const buffer = xlsx.build([{ data }], sheetOptions)
  const filePath = `${newRootDir}/${filename}.xlsx`
  fs.outputFileSync(filePath, buffer)
}

export { exportExcel }
