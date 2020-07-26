import * as babel from '@babel/core';
import { DOUBLE_BYTE_REGEX } from '../const';
import * as ts from 'typescript';

function transferI18n(code, filename, lang?) {
  if (lang === 'ts') {
    return typescriptI18n(code, filename);
  } else {
    return javascriptI18n(code, filename);
  }
}
function typescriptI18n(code, fileName) {
  let arr = [];
  const ast = ts.createSourceFile('', code, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);
  function visit(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.StringLiteral: {
        /** 判断 Ts 中的字符串含有中文 */
        const { text } = node as ts.StringLiteral;
        if (text.match(DOUBLE_BYTE_REGEX)) {
          arr.push(text);
        }
        break;
      }
    }
    ts.forEachChild(node, visit);
  }
  ts.forEachChild(ast, visit);
  return arr;
}
function javascriptI18n(code, filename) {
  let arr = [];
  let visitor = {
    StringLiteral(path) {
      if (path.node.value.match(DOUBLE_BYTE_REGEX)) {
        const text = (path.node.value || '').trim()
        text && arr.push(text);
      }
    }
  };
  let arrayPlugin = { visitor };
  const babelObject = babel.transform(code.toString(), {
    filename,
    plugins: [arrayPlugin]
  });
  return arr;
}
// 必须将模板语法中的所有待翻译语句翻译完成才能进行ast的string解析
function findVueText (ast) {
  let arr = [];
  const regex1 = /\`(.+?)\`/g;
  // 递归匹配获取文案信息
  function recursive(ast){
    if(ast.expression){
      let text = ast.expression.match(regex1)
      if(text && text[0].match(DOUBLE_BYTE_REGEX)){
        text.forEach(itemText => {
          itemText.match(DOUBLE_BYTE_REGEX) && arr.push({
            text: itemText,
            start: ast.start,
            end: ast.end
          })
        }) 
      }
    } else {
      ast.children && ast.children.forEach(item => {
        recursive(item)
      })
    }
  }
  recursive(ast)
  return arr
}
export { transferI18n, findVueText };
