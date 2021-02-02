import * as qs from 'qs'
import * as request from 'request'
import * as md5 from 'js-md5'
// import { getRandomStr, encodeUtf8 } from './utils'
interface LdResultType {
  srcLangs: string[];
  srclangs_confidences: number[];
  extended_srclangs: string[]
}
interface SentencesType {
  trans: string;
  orig: string;
  backend: number;
}
export interface TranslateResponseType {
  sentences: SentencesType[];
  src: string;
  confidence: number;
  spell: object;
  ld_result: LdResultType;
}

export interface Options {
  q?: string;
  to?: string;
  from?: string;
  secretKey: string;
  appid: string;
  [key: string]: any;
}

// 获取随机盐值
function getRandomStr (length:number = 4): string {
  let result = Math.floor(Math.random() * 90 + 10).toString()
  for (let i = 0; i < length - 2; i++) {
    let ranNum = Math.ceil(Math.random() * 25)
    result += String.fromCharCode(65 + ranNum).toString()
  }
  return result
}

// 百度通用翻译 api 文档  https://fanyi-api.baidu.com/doc/21
export function baiduTranslate (text: string, options: Options) {
  const { appid, secretKey } = options
  const salt = getRandomStr(8)
  const signStr = appid + text + salt + secretKey
  const sign = md5(signStr)
  // console.log('sign', sign, signStr)
  const params = {
    q: text,
    from: 'auto',
    to: 'en',
    appid,
    salt,
    sign,
    ...options
  }
  return new Promise((resolve, reject) => {
    if (!appid || !secretKey) return reject({ error_code: '52003', error_msg: '请设置 appid 和 secretKey 参数' })
    request({
      url: `http://api.fanyi.baidu.com/api/trans/vip/translate?${qs.stringify(params)}`,
      method: 'get',
      headers: {
        'Content-Type': 'application/json'
      }
    }, function (error, response, body) {
      const delayTime = text.length > 15 ? 3000 : 1000
      setTimeout(() => {
        if (error) return reject(new Error(error))
        try {
          const data = JSON.parse(body)
          if (data.error_code) return reject(data)
          resolve(data)
        } catch (e) {
          reject(new Error(e))
        }
        // console.log('body ========', typeof body, body)
      }, delayTime)
    })
  })
}
