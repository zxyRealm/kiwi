const translate = require('google-translate-open-api')
const fs = require('fs')
const _ =  require('lodash');

const path = require('path');
const { resolve } = require('path');
const { parseMultiple, Options } = translate

console.log(_.set({}, 'first_aaa.bbb.c', '哈哈哈哈哈哈'))
// const translateText = translate.default
// console.log(translate)
// const content = fs.readFileSync(path.resolve('./', 'export-en.xlsx'), { encoding: 'utf-8' })
// console.log('text', content)
// translateText('中国', {
//   to: 'en'
// }).then(res => {
//   console.log('res', res)
// }).catch(error => {
//   console.error('error', error)
// })
