import * as qs from 'qs'
import * as request from 'request'
import * as md5 from 'js-md5'
import { getRandomStr, encodeUtf8 } from './utils'
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

// 百度通用翻译 api 文档  https://fanyi-api.baidu.com/doc/21
export function daiduTranslate (text: string, options: Options) {
  const { appid = '20210105000663752', secretKey = 'W1uUbJOMvFevPj0OcjG1' } = options
  const salt = getRandomStr(8)
  const signStr = appid + text + salt + secretKey
  const sign = md5(signStr)
  console.log('sign', sign, signStr)
  const params = {
    q: encodeUtf8(text),
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
      method: 'get'
    }, function (error, response, body) {
        setTimeout(() => {
          if (error) return reject(error)
          resolve(body)
          console.log('body ========', body)
        }, 1000)
       
    })
  })
}
