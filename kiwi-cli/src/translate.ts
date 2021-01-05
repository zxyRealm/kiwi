import * as qs from 'qs'
import * as request from 'request'

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
  client?: string;
  dt?: string;
  dj?: 1;
  ie?: string;
  sl?: string; // 源语言类型
  tl?: string; // 翻译后的语言类型
  q?: string;
  to?: string;
  from?: string;
  [key: string]: any;
}

export function googleTranslate (text: string, options?: Options) {
  return new Promise<TranslateResponseType>((resolve, reject) => {
    if (typeof text !== 'string') return reject('translate text must be a string')
    const { to, from } = options || ({} as Options)
    const params = {
      client: 'gtx',
      dt: 't',
      dj: 1,
      ie: 'UTF-8',
      sl: from || 'auto', // 源语言类型
      tl: to || 'en', // 翻译后的语言类型
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

