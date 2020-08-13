/**
 * @author doubledream
 * @desc 更新文件
 */

import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as prettier from 'prettier';
import * as ts from 'typescript';
import { readFile, writeFile } from './file';
import { getLangData } from './getLangData';
import { getProjectConfig, getLangDir } from '../utils';
import * as slash from 'slash2';
import { scrypt } from 'crypto';
import * as vueCompiler from 'vue-template-compiler'

const CONFIG = getProjectConfig();
const srcLangDir = getLangDir(CONFIG.srcLang);

function updateLangFiles(keyValue, text, validateDuplicate, filePath) {
  const isVueFile = _.endsWith(filePath, '.vue') || _.endsWith(filePath, '.js')
  let [, filename, ...restPath] = keyValue.split('.');
  let fullKey = restPath.join('.');
  let targetFilename = `${srcLangDir}/${filename}.ts`;
  
  if (isVueFile) {
    // 根据项目文件生成语言文件目录，以 src 为基础目录在语言包文件进行映射，目录层级大于3时进行合并
    const files = filePath.replace(/\\/, '\\').split('\\')
    let srcFiles = files.slice(files.findIndex(i => i === 'src') + 1)
    srcFiles = srcFiles.length > 4 ? srcFiles.slice(0, 4) : srcFiles
    filename = srcFiles.join('/').lastIndexOf('.') === -1 ? srcFiles.join('/') : srcFiles.join('/').substring(0, srcFiles.join('/').lastIndexOf('.'))
    fullKey = keyValue;
    targetFilename = slash(`${srcLangDir}/${filename}.js`);
  }
  if (!isVueFile && !_.startsWith(keyValue, 'I18N.')) {
    return;
  }
  if (!fs.existsSync(targetFilename)) {
    // console.log('write FILE', )
    fs.outputFileSync(targetFilename, generateNewLangFile(fullKey, text));
    addImportToMainLangFile(filename);
    console.log(`成功新建语言文件 ${targetFilename}`);
  } else {
    // 清除 require 缓存，解决手动更新语言文件后再自动抽取，导致之前更新失效的问题
    const mainContent = getLangData(targetFilename);
    const obj = mainContent;

    if (Object.keys(obj).length === 0) {
      console.log(`${filePath} 解析失败，该文件包含的文案无法自动补全`);
    }

    if (validateDuplicate && _.get(obj, fullKey) !== undefined) {
      console.log(`${targetFilename} 中已存在 key 为 \`${fullKey}\` 的翻译，请重新命名变量`);
      throw new Error('duplicate');
    }
    // \n 会被自动转义成 \\n，这里转回来
    text = text.replace(/\\n/gm, '\n');
    _.set(obj, fullKey, text);
    // console.log('new lang file', obj)
    fs.outputFileSync(targetFilename, prettierFile(`export default ${JSON.stringify(obj, null, 2)}`));
  }
}

/**
 * 使用 Prettier 格式化文件
 * @param fileContent
 */
function prettierFile(fileContent) {
  try {
    return prettier.format(fileContent, {
      parser: 'typescript',
      trailingComma: 'none',
      singleQuote: true
    });
  } catch (e) {
    console.error(`代码格式化报错！${e.toString()}\n代码为：${fileContent}`);
    return fileContent;
  }
}

function generateNewLangFile(key, value) {
  const obj = _.set({}, key, value);

  return prettierFile(`export default ${JSON.stringify(obj, null, 2)}`);
}

function addImportToMainLangFile(newFilename) {
  let mainContent = '';
  const filePath = `${srcLangDir}/index.js`
  const exportName = newFilename.split('/')
    .filter(i => i)
    .map(str => {
      return str.substr(0, 1).toLocaleUpperCase() + str.substr(1)
    }).join('')
  if (fs.existsSync(filePath)) {
    mainContent = fs.readFileSync(filePath, 'utf8');
    mainContent = mainContent.replace(/^(\s*import.*?;)$/m, `$1\nimport ${exportName} from './${newFilename}';`);
    if (/(}\);)/.test(mainContent)) {
      if (/\,\n(}\);)/.test(mainContent)) {
        /** 最后一行包含,号 */
        mainContent = mainContent.replace(/(}\);)/, `  ...${exportName},\n$1`);
      } else {
        /** 最后一行不包含,号 */
        mainContent = mainContent.replace(/\n(}\);)/, `,\n  ...${exportName},\n$1`);
      }
    }
    // 兼容 export default { common };的写法
    if (/(};)/.test(mainContent)) {
      if (/\,\n(};)/.test(mainContent)) {
        /** 最后一行包含,号 */
        mainContent = mainContent.replace(/(};)/, `  ...${exportName},\n$1`);
      } else {
        /** 最后一行不包含,号 */
        mainContent = mainContent.replace(/\n(};)/, `,\n  ....${exportName},\n$1`);
      }
    }
  } else {
    mainContent = `import ${exportName} from './${newFilename}';\n\nexport default {\n ...${exportName},\n};`;
  }

  fs.writeFileSync(filePath, mainContent);
}

/**
 * 检查是否添加 import I18N 命令
 * @param filePath 文件路径
 */
function hasImportI18N(filePath) {
  // const isVueFile = _.endsWith(filePath, '.vue')
  // if (isVueFile) return true
  const code = readFile(filePath);
  if (code.includes(CONFIG.importI18N)) {
    return true
  }
  const ast = ts.createSourceFile('', code, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TSX);
  let hasImportI18N = false;

  function visit(node) {
    if (node.kind === ts.SyntaxKind.ImportDeclaration) {
      const importClause = node.importClause;

      // import I18N from 'src/utils/I18N';
      if (importClause.kind === ts.SyntaxKind.ImportClause) {
        if (importClause.name) {
          if (importClause.name.escapedText === 'I18N') {
            hasImportI18N = true;
          }
        } else {
          const namedBindings = importClause.namedBindings;
          // import { I18N } from 'src/utils/I18N';
          if (namedBindings.kind === ts.SyntaxKind.NamedImports) {
            namedBindings.elements.forEach(element => {
              if (element.kind === ts.SyntaxKind.ImportSpecifier && _.get(element, 'name.escapedText') === 'I18N') {
                hasImportI18N = true;
              }
            });
          }
          // import * as I18N from 'src/utils/I18N';
          if (namedBindings.kind === ts.SyntaxKind.NamespaceImport) {
            if (_.get(namedBindings, 'name.escapedText') === 'I18N') {
              hasImportI18N = true;
            }
          }
        }
      }
    }
  }

  ts.forEachChild(ast, visit);

  return hasImportI18N;
}

/**
 * 在合适的位置添加 import I18N 语句
 * @param filePath 文件路径
 */
function createImportI18N(filePath) {
  const code = readFile(filePath);
  const ast = ts.createSourceFile('', code, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TSX);
  
  // const isTsFile = _.endsWith(filePath, '.ts') || _.endsWith(filePath, '.js');
  // const isTsxFile = _.endsWith(filePath, '.tsx');
  const isVueFile = _.endsWith(filePath, '.vue');
  // ts/tsx/js
  const importStatement = `\n${CONFIG.importI18N}\n`;
  let pos = ast.getStart(ast, false);
  if (isVueFile) {
    const sfc = vueCompiler.parseComponent(code.toString());
    pos = sfc.script.start
  }
  const updateCode = code.slice(0, pos) + importStatement + code.slice(pos);
  return updateCode;
}

/**
 * 更新文件
 * @param filePath 当前文件路径
 * @param arg  目标字符串对象
 * @param val  目标 key
 * @param validateDuplicate 是否校验文件中已经存在要写入的 key
 */
function replaceAndUpdate(filePath, arg, val, validateDuplicate) {
  const code = readFile(filePath);
  const isHtmlFile = _.endsWith(filePath, '.html');
  const isVueFile = _.endsWith(filePath, '.vue') || _.endsWith(filePath, '.js');

  let newCode = code;
  let finalReplaceText = arg.text;
  const { start, end } = arg.range;
  // 若是字符串，删掉两侧的引号
  if (isVueFile) {
    newCode = replaceInVue(filePath, arg, val)
    // console.log('new code =', newCode)
  } else if (arg.isString) {
    // 如果引号左侧是 等号，则可能是 jsx 的 props，此时要替换成 {
    const preTextStart = start - 1;
    const [last2Char, last1Char] = code.slice(preTextStart, start + 1).split('');
    let finalReplaceVal = val;
    if (last2Char === '=') {
      if (isHtmlFile) {
        finalReplaceVal = '{{' + val + '}}';
      } else {
        finalReplaceVal = '{' + val + '}';
      }
    }
    // 若是模板字符串，看看其中是否包含变量
    if (last1Char === '`') {
      const varInStr = arg.text.match(/(\$\{[^\}]+?\})/g);
      if (varInStr) {
        const kvPair = varInStr.map((str, index) => {
          return `val${index + 1}: ${str.replace(/^\${([^\}]+)\}$/, '$1')}`;
        });
        finalReplaceVal = `I18N.template(${val}, { ${kvPair.join(',\n')} })`;

        varInStr.forEach((str, index) => {
          finalReplaceText = finalReplaceText.replace(str, `{val${index + 1}}`);
        });
      }
    }

    newCode = `${code.slice(0, start)}${finalReplaceVal}${code.slice(end)}`;
  } else {
    if (isHtmlFile) {
      newCode = `${code.slice(0, start)}{{${val}}}${code.slice(end)}`;
    } else {
      newCode = `${code.slice(0, start)}{${val}}${code.slice(end)}`;
    }
  }

  try {
    // 更新语言文件
    updateLangFiles(val, finalReplaceText, validateDuplicate, filePath);
    // 若更新成功再替换代码
    return writeFile(filePath, newCode);
  } catch (e) {
    console.error(e)
    return Promise.reject(e.message);
  }
}

// 替换 Vue 文件中 key 值
function replaceInVue(filePath, arg, val) {
  const code = readFile(filePath)
  // let finalReplaceText = arg.text
  const { start, end } = arg.range
  let finalReplaceVal = val
  switch (arg.type) {
    case 'static':
      finalReplaceVal = `{{\$t('${val}')}}`
      break
    case 'template':
      finalReplaceVal = `\${$t('${val}')}`
      break
    case 'attrStr':
      finalReplaceVal = `:${arg.name}="$t('${val}')"`
      return `${code.slice(0, start - arg.name.length - 2)}${finalReplaceVal}${code.slice(end + 1)}`
    case 'jsStr':
      finalReplaceVal = `i18n.t('${val}')`
      break
    case 'jsTemplate':
      finalReplaceVal = `\${i18n.t('${val}')}`
      break
  }

  return `${code.slice(0, start)}${finalReplaceVal}${code.slice(end)}`;
}
export { replaceAndUpdate, hasImportI18N, createImportI18N };
