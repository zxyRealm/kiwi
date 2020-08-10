const fs = require('fs-extra')
const path = require('path')
const slash = require('slash2');
const dirs = require('node-dir')
const ts = require('typescript')

function resolve (dir) {
  return path.resolve(__dirname, './', dir)
}

function readFile (filename) {
  return fs.readFileSync(filename, { encoding: 'utf8' })
}
const filePath = resolve('./login/home/footer')
// console.log(slash(filePath), slash(filePath).split('/'))
const list = [{ name: 1, age: 2 }, { test: 'test', title: 'title' }]
const newObj = list.reduce((pre, curr) => {
  return {
    ...pre,
    ...curr
  }
}, {})

// 遍历语言包文件
function scanLangFlies (langDir) {
  dirs.readFiles(resolve(langDir), {
    match: /\.js$/
  },
    (error, content, next) => {
      if (error) throw new Error(error)
      next()
    },
    (error, files) => {
      if (error) throw new Error(error)
      files.forEach(file => {
        createXlsxFile(file, resolve(langDir))
      })
      // console.log(files)
  })
}

scanLangFlies('./locales')

// 根据原文件目录结构生成新文件目录
function createXlsxFile (filename, rootDir) {
  // 导出 excel 存放目录
  const newRootDir = '/export-excel'
  // 处理新文件目录生成，对三级以上目录进行合并
  const relativePath = slash(filename).replace(slash(rootDir), '')
  const newName = relativePath.replace(/\.js$/, '').split('/').slice(0, 5)
  newName.shift()
  const fileStr = readFile(filename)
  // const tsObj = ts.createSourceFile(
  //   '',
  //   fileJson,
  //   ts.ScriptTarget.ES2015,
  //   true,
  //   ts.ScriptKind.TS
  // )
  // tsObj
  const fileObj = fileStr.replace(/([\s\S]*export\s*default\s*)({[\s\S]+});?\s*$/, '$2')
  // console.log(fileObj)
  if (newName[1] !== 'index') {
    console.log('file text', eval(`(${fileObj})`))
    if (newName.length === 2) {
    }
  }
}


