const translate = require('google-translate-open-api')

const { parseMultiple, Options } = translate

const translateText = translate.default
console.log(translate)

translateText('中国', {
  to: 'en'
}).then(res => {
  console.log('res', res)
}).catch(error => {
  console.error('error', error)
})