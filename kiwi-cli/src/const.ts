/**
 * @author linhuiw
 * @desc 项目配置文件配置信息
 */
const fs = require('fs');
import { Tld } from 'google-translate-open-api'

export const KIWI_CONFIG_FILE = 'kiwi-config.json';

export const I18N_GLOBAL_PROPERTY = '$t' || 'i18n.t'

export const matchExpReg = (flags?: string) => new RegExp(`\\${I18N_GLOBAL_PROPERTY}\\((\'|"|\`)(.*?)(\'|"|\`)`, flags)

interface Config {
  dir: string,
  configFile: string;
  defaultConfig: {
    kiwiDir: string;
    configFile: string;
    srcLang: string;
    zhLang: string;
    distLangs: string[];
    translateOptions: {
      tld?: Tld;
      concurrentLimit: number;
      requestOptions?: object;
      timeout: number;
      browersUrl?: string;
      browers?: boolean;
    },
    excelOptions: {
      keyIndex: number;
      valueIndex: number;
    }
    importI18N: string;
    exclude?: string | RegExp | (string | RegExp)[];
    include?: string | RegExp | (string | RegExp)[];
  },
  langMap: {},
  zhIndexFile?: string;
  zhTestFile?: string;
}

export const PROJECT_CONFIG: Config = {
  dir: './.kiwi',
  configFile: `./.kiwi/${KIWI_CONFIG_FILE}`,
  defaultConfig: {
    kiwiDir: './.kiwi',
    configFile: `./.kiwi/${KIWI_CONFIG_FILE}`,
    srcLang: 'zh-CN',
    zhLang: 'zh-CN',
    distLangs: ['en', 'zh-CN'],
    translateOptions: {
      tld: 'cn',
      concurrentLimit: 10,
      requestOptions: {},
      timeout: 6 * 1000,
      browers: false
    },
    excelOptions: {
      keyIndex: 0,
      valueIndex: 1
    },
    importI18N: `import i18n from '@/locale';`,
    exclude: ['node_modules'],
    include: ['src']
  },
  langMap: {
    ['en-US']: 'en',
    ['en_US']: 'en'
  },
  zhIndexFile: `import common from './common';
  export default {
    ...common
  }`,
  zhTestFile: `export default {
    test: '测试'
  }`
};

const DOUBLE_BYTE_REGEX = /[\u4e00-\u9fa5]/g
export { DOUBLE_BYTE_REGEX }
