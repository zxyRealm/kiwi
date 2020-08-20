/**
 * @author linhuiw
 * @desc 项目配置文件配置信息
 */
const fs = require('fs');


export const KIWI_CONFIG_FILE = 'kiwi-config.json';

export const I18N_GLOBAL_PROPERTY = '$t' || 'i18n.t'

export const matchExpReg = (flags?: string) => new RegExp(`\\${I18N_GLOBAL_PROPERTY}\\((\'|"|\`)(.*?)(\'|"|\`)`, flags)

export const PROJECT_CONFIG = {
  dir: './.kiwi',
  configFile: `./.kiwi/${KIWI_CONFIG_FILE}`,
  defaultConfig: {
    kiwiDir: './.kiwi',
    configFile: `./.kiwi/${KIWI_CONFIG_FILE}`,
    srcLang: 'zh-CN',
    distLangs: ['en', 'zh-CN'],
    translateOptions: {
      tld: 'cn',
      concurrentLimit: 10,
      requestOptions: {},
      timeout: 6 * 1000
    },
    importI18N: `import I18N from 'src/utils/I18N';`,
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

/**
 * 适配不同的语言文件夹位置
 */
// function dirAdaptor() {
//   const kiwiLangPrefix = `${vscode.workspace.rootPath}/.kiwi/zh-CN/`;
//   const langPrefix = `${vscode.workspace.rootPath}/langs/zh-CN/`;

//   /** 兼容 zh_CN 情况 */
//   const _kiwiLangPrefix = `${vscode.workspace.rootPath}/.kiwi/zh_CN/`;
//   const _langPrefix = `${vscode.workspace.rootPath}/langs/zh_CN/`;

//   if (fs.existsSync(kiwiLangPrefix)) {
//     return kiwiLangPrefix;
//   } else if (fs.existsSync(langPrefix)) {
//     return langPrefix;
//   } else if (fs.existsSync(_kiwiLangPrefix)) {
//     return _kiwiLangPrefix;
//   } else if (fs.existsSync(_langPrefix)) {
//     return _langPrefix;
//   } else {
//     const files = getAllFiles(`${vscode.workspace.rootPath}/`);
//     const matchFiles = files.filter(fileName => {
//       if (
//         fileName.includes('/.kiwi/zh-CN/index.ts') ||
//         fileName.includes('/langs/zh-CN/index.ts') ||
//         fileName.includes('/.kiwi/zh_CN/index.ts') ||
//         fileName.includes('/langs/zh_CN/index.ts')
//       ) {
//         return true;
//       }
//       return false;
//     });

//     if (matchFiles.length) {
//       return matchFiles[0].replace('index.ts', '');
//     }
//   }
// }

// function getDefaultDir() {
//   const dir = dirAdaptor();
//   if (!dir) {
//     const preFix = getConfiguration('langPrefix');
//     if (preFix) {
//       return `${vscode.workspace.rootPath}/${preFix}`;
//     }
//   }
//   return dir;
// }

// const LANG_PREFIX = getDefaultDir();
// const DIR_ADAPTOR = dirAdaptor();
// const I18N_GLOB = `${LANG_PREFIX}**/*.ts`;

// unicode 中文编码 https://www.qqxiuzi.cn/zh/hanzi-unicode-bianma.php
// 匹配中文文本
// const DOUBLE_BYTE_REGEX = /[\u4E00-\u9FEF\u3400-\u4DB5\u2A700-\u2B734\u2B740-\u2B81D\u2B820-\u2CEA1\u2CEB0-\u2EBE0\u30000-\u3134A\u2F00-\u2FD5\u2E80-\u2EF3\uF900-\uFAD9\u2F800-\u2FA1D\u31C0-\u31E3\u3105-\u312F]/g;
// const DOUBLE_BYTE_REGEX = /[^\x00-\xff，。、：；．‘’！？…–￥℃《》〔〕「」【】『』〈〉（）“”]/g
const DOUBLE_BYTE_REGEX = /[\u4e00-\u9fa5]/g
export { DOUBLE_BYTE_REGEX }
