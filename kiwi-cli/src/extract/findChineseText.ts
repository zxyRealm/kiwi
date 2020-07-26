/**
 * @author doubledream
 * @desc 利用 Ast 查找对应文件中的中文文案
 */

import * as ts from 'typescript';
import * as compiler from '@angular/compiler';
import * as vueCompiler from 'vue-template-compiler';
import { transferI18n, findVueText } from './babelUtil';
// import { result } from 'lodash';

const DOUBLE_BYTE_REGEX = /[^\x00-\xff]/g;

/**
 * 去掉文件中的注释
 * @param code
 * @param fileName
 */
function removeFileComment(code, fileName) {
  const printer = ts.createPrinter({ removeComments: true });
  const sourceFile = ts.createSourceFile(
    '',
    code,
    ts.ScriptTarget.ES2015,
    true,
    fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  return printer.printFile(sourceFile);
}

/**
 * 查找 Ts 文件中的中文
 * @param code 
 */
function findTextInTs(code: string, fileName: string) {
  const matches = [];
  const ast = ts.createSourceFile('', code, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TSX);

  function visit(node: ts.Node) {
    switch (node && node.kind) {
      case ts.SyntaxKind.StringLiteral: {
        /** 判断 Ts 中的字符串含有中文 */
        const { text } = node as ts.StringLiteral;
        if (text.match(DOUBLE_BYTE_REGEX)) {
          const start = node.getStart();
          const end = node.getEnd();
          const range = { start, end };
          matches.push({
            range,
            text,
            isString: true
          });
        }
        break;
      }
      case ts.SyntaxKind.JsxElement: {
        const { children } = node as ts.JsxElement;

        children.forEach(child => {
          if (child && child.kind === ts.SyntaxKind.JsxText) {
            const text = child.getText();
            /** 修复注释含有中文的情况，Angular 文件错误的 Ast 情况 */
            const noCommentText = removeFileComment(text, fileName);

            if (noCommentText.match(DOUBLE_BYTE_REGEX)) {
              const start = child.getStart();
              const end = child.getEnd();
              const range = { start, end };

              matches.push({
                range,
                text: text.trim(),
                isString: false
              });
            }
          }
        });
        break;
      }
      case ts.SyntaxKind.TemplateExpression: {
        const { pos, end } = node;
        const templateContent = code.slice(pos, end);

        if (templateContent.match(DOUBLE_BYTE_REGEX)) {
          const start = node.getStart();
          const end = node.getEnd();
          const range = { start, end };
          matches.push({
            range,
            text: code.slice(start + 1, end - 1),
            isString: true
          });
        }
        break;
      }
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral: {
        const { pos, end } = node;
        const templateContent = code.slice(pos, end);

        if (templateContent.match(DOUBLE_BYTE_REGEX)) {
          const start = node.getStart();
          const end = node.getEnd();
          const range = { start, end };
          matches.push({
            range,
            text: code.slice(start + 1, end - 1),
            isString: true
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }
  ts.forEachChild(ast, visit);

  return matches;
}

/**
 * 查找 HTML 文件中的中文
 * @param code
 */
function findTextInHtml(code) {
  const matches = [];
  const ast = compiler.parseTemplate(code, 'ast.html', {
    preserveWhitespaces: false
  });

  function visit(node) {
    const value = node.value;
    if (value && typeof value === 'string' && value.match(DOUBLE_BYTE_REGEX)) {
      const valueSpan = node.valueSpan || node.sourceSpan;
      let {
        start: { offset: startOffset },
        end: { offset: endOffset }
      } = valueSpan;
      const nodeValue = code.slice(startOffset, endOffset);
      let isString = false;
      /** 处理带引号的情况 */
      if (nodeValue.charAt(0) === '"' || nodeValue.charAt(0) === "'") {
        isString = true;
      }
      const range = { start: startOffset, end: endOffset };
      matches.push({
        range,
        text: value,
        isString
      });
    } else if (value && typeof value === 'object' && value.source && value.source.match(DOUBLE_BYTE_REGEX)) {
      /*
       * <span>{{expression}}中文</span> 这种情况的兼容
       */
      const chineseMatches = value.source.match(DOUBLE_BYTE_REGEX);
      chineseMatches.map(match => {
        const valueSpan = node.valueSpan || node.sourceSpan;
        let {
          start: { offset: startOffset },
          end: { offset: endOffset }
        } = valueSpan;
        const nodeValue = code.slice(startOffset, endOffset);
        const start = nodeValue.indexOf(match);
        const end = start + match.length;
        const range = { start, end };
        matches.push({
          range,
          text: match[0],
          isString: false
        });
      });
    }

    if (node.children && node.children.length) {
      node.children.forEach(visit);
    }
    if (node.attributes && node.attributes.length) {
      node.attributes.forEach(visit);
    }
  }

  if (ast.nodes && ast.nodes.length) {
    ast.nodes.forEach(visit);
  }
  return matches;
}
/*
* 匹配文案开始结束标签
* @param {String} source 源字符串
* @param {Number} start 开始位置索引值
* @param {String} startCode 开始标签字符
*/
function checkCloseLabel (source, start, end, startCode, endCode? ) {
  return source.substr(start, 1) === startCode && source.substr(end, 1) === (endCode || startCode)
}

/*
* 查找 Vue 模板文件中的中文
*/
function findTextInVue(code: string, fileName: string) {
  const matches = []
  let rexSpace1 = new RegExp(/&ensp;/, 'g')
  let rexSpace2 = new RegExp(/&emsp;/, 'g')
  let rexSpace3 = new RegExp(/&nbsp;/, 'g')
  code = code.replace(rexSpace1,'ccsp&;').replace(rexSpace2,'ecsp&;').replace(rexSpace3,'ncsp&;')
  let coverRex1 = new RegExp(/ccsp&;/, 'g')
  let coverRex2 = new RegExp(/ecsp&;/, 'g')
  let coverRex3 = new RegExp(/ncsp&;/, 'g')
  // outputSourceRange 输入代码段在源码中的位置范围
  const vueObject = vueCompiler.compile(code.toString(), { outputSourceRange: true })
  const vueAst = vueObject.ast
  
  // 查询模板字符串中文案，替换并翻译
  let expressTemp = findVueText(vueAst)
  expressTemp.forEach(item => {
    const { start, end } = item
    matches.push({
      range: {
        start,
        end
      },
      text: item.text.trimRight(),
      isString: true
    });     
  })
  const outCode = vueObject.render.toString().replace('with(this)', 'function a()')
  // 将 vue-template-complier 编译得到的 render 字符串通过 @babel/core 再编译，运用 babel 对象中 StringLiteral 类型，配合自定插件进行文案提取
  const vueTemp = transferI18n(outCode, 'as.vue')

  vueTemp.forEach(item => {
    let items = item.replace(/\{/g,'\\{').replace(/\}/g,'\\}').replace(/\$/g,'\\$').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/\+/g,'\\+').replace(/\*/g,'\\*').replace(/\^/g,'\\^')
    const reg1 = new RegExp(items, 'g')
    let result = null
    while ((result = reg1.exec(code))) {
      const res = result
      let last = reg1.lastIndex
      last = last - (res[0].length - res[0].trimRight().length)
      const isString = checkCloseLabel(code, res.index - 1, last, '"') ||
      checkCloseLabel(code, res.index - 1, last, "'") ||
      checkCloseLabel(code, res.index - 1, last, '>', '<') ? true : false
      matches.push({
        range: {
          start: res.index,
          end: last
        },
        text: res[0].trimRight().replace(coverRex1,'&ensp;').replace(coverRex2,'&emsp;').replace(coverRex3,'&nbsp;'),
        isString
      })
    }
  })
  return matches
}

/**
 * 递归匹配代码的中文
 * @param code
 */
function findChineseText(code: string, fileName: string) {
  if (fileName.endsWith('.html')) {
    return findTextInHtml(code);
  } else if (fileName.endsWith('.vue')) {
    return findTextInVue(code, fileName)
  }
  return findTextInTs(code, fileName);
}

export { findChineseText };
