const fs = require('fs-extra')
const path = require('path')
const slash = require('slash2');
const dirs = require('node-dir')
const xlsx = require('node-xlsx').default

function resolve (dir) {
  return path.resolve(__dirname, './', dir)
}

function readFile (filename) {
  return fs.readFileSync(filename, { encoding: 'utf8' })
}

// 列宽设置
const sheetOptions = { '!cols': [{ wch: 30 }, { wch: 50 }, { wch: 30 }] }

// 读取 sheet 表中所有 key 值，默认第一列为 key
function readSheetData (filename, index = 0, type?) {
  if (!filename) return []
  const sheets = xlsx.parse(filename)
  const dataMap = {}
  const keysList = []
  sheets.forEach(sheet => {
    const { data } = sheet
    data.forEach(row => {
      keysList.push(row)
      dataMap[row[3]] = row[index + 1]
    })
  })
  return type === 'obj' ? dataMap :  keysList
}

// 导出文件 key 值 对比
// 在目标表格中查找与源表格中中文内容 value 值相同的 key, 将对应的英文同步到源表格中
function syncExcel(originFile: string, targetFile: string) {
  const originData = readSheetData(originFile) as any[]
  const targetData = readSheetData(targetFile, 0, 'obj')
  // 对比后数据结果
  // 默认第二列为中文 第三列为英文，对比中文值，获取其对应的英文值，必同步到源表格中
  const data = [
    [`${originFile} key`, `中文`, '英文'],
  ]
  console.log('list=====', originData.slice(0, 5))
  let count = 0
  originData.forEach(item => {
    if (count < 5) { console.log('origin', item, targetData[item[1]]) }
    count++
    if (targetData[item[1]]) {
      data.push([item[0], item[1], targetData[item[1]]])
    }
  })
  const buffer = xlsx.build([{ data }], sheetOptions)
  const filePath = `./excel-sync.xlsx`
  fs.outputFileSync(filePath, buffer)
}

export { syncExcel }
