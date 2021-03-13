import * as md5 from 'js-md5'
import * as translate from 'translate'
// import { getRandomStr, encodeUtf8 } from './utils'
// Thanks libretranslate.com free translate service
// api address: https://libretranslate.com/docs/

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

// api 文档  https://libretranslate.com/docs/
export function Translate (text: string, options: Options) {
  const { appid, secretKey } = options
  const salt = getRandomStr(8)
  const signStr = appid + text + salt + secretKey
  const sign = md5(signStr)
  const params = {
    q: text,
    engine: 'libre',
    from: 'zh',
    to: 'en',
    appid,
    salt,
    sign,
    ...options
  }
  return new Promise((resolve, reject) => {
    translate(params.q, params).then(text => {
      resolve(text)
    }).catch((error) => {
      reject(error)
    })
  })
}
