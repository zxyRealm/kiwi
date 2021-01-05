const qs = require('qs')
const _ =  require('lodash');
const request = require('request')
const md5 = require('js-md5')

// const daiduTranslate = require('baidu-translate-api')

function daiduTranslate (text, options = {}) {
  const { appid = '20210105000663752', secretKey = 'W1uUbJOMvFevPj0OcjG1' } = options
  const salt = getRandomStr(8)
  const signStr = appid + text + salt + secretKey
  const sign = md5(signStr)
  console.log('sign', sign, signStr)
  const params = {
    q: text,
    from: 'auto',
    to: 'en',
    appid,
    salt,
    sign,
    ...options
  }
  console.log('params', params)
  return new Promise((resolve, reject) => {
    request({
      url: `http://api.fanyi.baidu.com/api/trans/vip/translate?${qs.stringify(params)}`,
      method: 'get',
      headers: {
        'Content-Type': 'application/json'
      }
    }, function(error, response, body) {
        if (error) return reject(error)
        resolve(body)
        console.log('body ========', body)
    })
  })
}


function getRandomStr (length = 4) {
  let result = Math.floor(Math.random() * 90 + 10).toString()
  for (let i = 0; i < length - 2; i++) {
    let ranNum = Math.ceil(Math.random() * 25)
    result += String.fromCharCode(65 + ranNum).toString()
  }
  return result
}

daiduTranslate('中国').then(res => {
  console.log('baidu translate', res)
}).catch(error => {
  console.error('error', error)
})

