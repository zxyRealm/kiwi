const dirs = require('node-dir')
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

fs.readdir('./', (error, list) => {
  if (error) throw error
  console.log('files list', list)
})

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

// translateText('翻译测试了')
(async function() {
  try {
    await translateText('翻译测试', { to: 'en' })
  } catch (error) {
    console.error(error)
  }
})()