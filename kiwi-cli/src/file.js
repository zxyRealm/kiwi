const slash = require('slash2')
const path = require('path')
const fs = require('fs')
const googleTranslate = require('google-translate-open-api').default
const { parseMultiple } = googleTranslate
const log = console.log
const chalk = require('chalk')
function resolve (dir) {
  return path.join(__dirname, '/', dir)
}

const options = {
  exclude: ['node_modules', 'src/locales', /\.js$/, 'test.txt'],
  include: ['src']
}

function translateText (text) {
  const options = {
    tld: 'cn',
    concurrentLimit: 10,
    requestOptions: {}
  }
  googleTranslate(text,
    {
      ...options,
      to: 'en'
    }).then(res => {
      let translatedText = res.data[0]
      if (Array.isArray(text)) {
        translatedText = parseMultiple(translatedText)
      }
      const randomTime = parseInt((Math.random() * 3).toString(), 10) + 3
      console.log('translate text-', translatedText)
      setTimeout(() => {
        // resolve(translatedText)
      }, randomTime)
      
    }).catch(error => {
      log('translate error', chalk.red(error.message))
      // reject(error)
    }
  );
}

function readFiles(dir) {
  const fileList = []
  const readFile = (directory) => {
    const files = fs.readdirSync(directory);
    files.forEach((item) => {
      var fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        readFile(path.join(directory, item));  //递归读取文件
      } else {
        fileList.push(fullPath)
      }
    });
  }
  readFile(dir)
  return fileList
}

googleTranslate('开始了', { to: 'en', from: 'zh-CN', tld: 'cn' }).then(res => {
  console.log('res', res.data)
}).catch(error => {
  console.error(error)
})
// (async function() {
//   try {
//     await translateText('翻译测试', { to: 'en' })
//   } catch (error) {
//     console.error(error)
//   }
// })()