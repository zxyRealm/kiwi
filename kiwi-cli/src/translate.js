const qs = require('qs')
const _ =  require('lodash');
const request = require('request')

function googleTranslate (text, options) {
  return new Promise((resolve, reject) => {
    if (typeof text !== 'string') return reject('translate text must be a string')
    const params = {
      client: 'gtx',
      dt: 't',
      dj: 1,
      ie: 'UTF-8',
      sl: 'auto', // 源语言类型
      tl: 'zh_TW', // 翻译后的语言类型
      q: text, // 要翻译的内容
      ...options
    }
    request({
      url: `http://translate.google.cn/translate_a/single?${qs.stringify(params)}`,
      method: 'get',
      headers: {
        'Content-Type': 'application/json'
      }
    }, function (error, res, body) {
        if (error) return reject(error)
        try {
          resolve(JSON.parse(body))
        } catch (e) {
          const errorMsg = body.match(/<div>(.*)<div>/g)
          reject(errorMsg)
          console.log('errorMsg', errorMsg)
        }
    })
  })
}

googleTranslate('中国,美国', { tl: 'en' }).then(res => {
  console.log('translate', typeof res, res)
}).catch(error => {
  console.error(error)
})

