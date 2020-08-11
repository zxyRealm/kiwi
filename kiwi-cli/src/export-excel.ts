const fs = require('fs-extra')
const path = require('path')
const slash = require('slash2');
const dirs = require('node-dir')
const xlsx = require('node-xlsx').default
import * as ts from 'typescript'

function resolve (dir) {
  return path.resolve(__dirname, './', dir)
}

function readFile (filename) {
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

// 将文件读取后转换问 js 对象
function transformToObject(filename) {
  const code = readFile(filename)
  const ast = ts.createSourceFile('', code, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);
  const keysObject = {}
  function visit(node: ts.Node) {
    switch (node && node.kind) {
      case ts.SyntaxKind.PropertyAssignment: {
      /** 判断 Ts 中的字符串含有中文 */
        interface A {
          name: ts.Identifier;
          initializer: ts.StringLiteral;
        }
        const { name, initializer }:A = node as ts.PropertyAssignment;
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
  dirs.readFiles(langDir, {
    match: /\.js$/
  },
    (error, content, next) => {
      if (error) throw new Error(error)
      next()
    },
    (error, files) => {
      if (error) throw new Error(error)
      const allData = getAllData(files, langDir)
      // console.log('all data', allData)
      createXlsxFile(lang || 'index', allData)
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
