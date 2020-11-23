/**
 * @author doubledream
 * @desc 利用 Ast 查找对应文件中的中文文案
 */

import * as ts from 'typescript';
import * as compiler from '@angular/compiler';
import * as vueCompiler from 'vue-template-compiler';
import {
  findTextInVueTs,
  filterStaticStr,
  filterTemplateStr,
  filterGlobalStr,
  filterAttrsText
} from './findChineseInVue'
import { DOUBLE_BYTE_REGEX, matchExpReg } from '../const'
import { replaceOccupyStr, checkTextIsIgnore } from '../utils'
import { stat } from 'fs';

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
        const start = node.getStart();
        const end = node.getEnd();
        const ignoreText = checkTextIsIgnore(code, start)

        if (text.match(DOUBLE_BYTE_REGEX) && !ignoreText) {
          
          const isGlobal = ['.t(', '$t('].includes(code.substr(start - 3, 3))
          const range = {
            start: start + Number(isGlobal),
            end: end - Number(isGlobal)
          };
          matches.push({
            type: isGlobal ? 'jsGlobal' : 'jsStr',
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
        const { pos, end: endIndex } = node;
        const templateContent = code.slice(pos, endIndex);
        const start = node.getStart();
        const end = node.getEnd();
        const ignoreText = checkTextIsIgnore(code, start)
        if (templateContent.match(DOUBLE_BYTE_REGEX) && !ignoreText) {
          const range = { start, end };
          matches.push({
            type: 'jsTemplate',
            range,
            text: code.slice(start + 1, end - 1),
            isString: true
          });
        }
        break;
      }
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral: {
        const { pos, end: endIndex } = node;
        const templateContent = code.slice(pos, endIndex);
        const start = node.getStart();
        const end = node.getEnd();
        const ignoreText = checkTextIsIgnore(code, start)
        if (templateContent.match(DOUBLE_BYTE_REGEX) && !ignoreText) {
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
      const ignoreText = checkTextIsIgnore(value, startOffset)
      if (ignoreText) return
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
        const ignoreText = checkTextIsIgnore(value, startOffset)
        if (ignoreText) return
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
* 从一个字符串中过滤出 文案的内容、位置信息、来源类型
* @param {string} 源字符串
* @param {number} 源字符串起始位置
* @return {array} 包含文案内容，位置信息，来源类型的数组
*/
function filterTextInString(str: string, sIndex: number) {
  const ignoreText = checkTextIsIgnore(str, sIndex)
  if (!str || ignoreText) return []
  const matches = []
  // 优先获取模板字符串中内容
  const matchText = (text: string, startIndex = 0) => {
    // $t() 结构
    const ignoreText = checkTextIsIgnore(text, startIndex)
    if (ignoreText) return
    const exGlobal = text.match(matchExpReg())
    if (exGlobal) {
      matches.push(...filterGlobalStr(text, startIndex))
    }
    /*
    * 由于 `` 中可能存在 $t()结构, 所以应该先将此部分替换成占位符
    */
    // `` 字符串模板
    const templateText = replaceOccupyStr(text, matchExpReg('g'))
    const exTemplate = templateText.match(/`(.*?)`/)
    if (exTemplate) {
      // 判断模板字符串是否包含变量插值
      // 如果模板字符串中无变量应用则直接输入字符串
      const itemList = filterTemplateStr(templateText, sIndex)
      matches.push(...itemList)
    }
    // 纯静态文案匹配
    const staticText = replaceOccupyStr(templateText, /`(.*?)`/g)
    matches.push(...filterStaticStr(staticText, startIndex))

  }
  matchText(str, sIndex)
  return matches
}

/*
* 处理文案首先区分 attribute 和 标签内容文案 
*/
function getAllChildrenContent(obj) {
  if (!obj) return []
  // obj.scopedSlots && obj.scopedSlots['"default"'] ? obj = obj.scopedSlots['"default"'] : obj
  return (obj.children || []).reduce((prev, curr) => {
    curr = curr.block || curr
    const { start } = curr
    // 提取 attrs 中文案
    const attrsMap = curr.rawAttrsMap
    const attrsList = filterAttrsText(attrsMap)
    const ignoreText = checkTextIsIgnore(curr.text, start)
    prev = prev.concat(attrsList)
    const itemText = !ignoreText && !curr.ifConditions && curr.text && curr.text.match(DOUBLE_BYTE_REGEX) && curr.text.match(DOUBLE_BYTE_REGEX).reduce((prev, curr) => {
      return prev.concat(curr)
    }, [])
    // 获取文案信息 并计算的得出每段文案起始终止位置
    // 文案内容不能重复匹配
    let itemList
    if (itemText) {
      itemList = filterTextInString(curr.text, start)
    }
    // 处理 if 条件句中文案提取
    if (curr.ifConditions) {
      curr.ifConditions.forEach(item => {
        if (item.block) {
          prev = prev.concat(getAllChildrenContent(item.block))
        }
      })
    }

    prev = prev.concat(scanSlotScopedText(curr))

    return (!curr.ifConditions && curr.children) ? prev.concat(getAllChildrenContent(curr)) : prev.concat(itemText ? itemList : [])
  }, [])
}

// 扫描处理 slot-scope 结构中文案
function scanSlotScopedText(obj) {
  const ssTemplate = obj && obj.scopedSlots && obj.scopedSlots['"default"']
  if (!obj || !ssTemplate) {
    return []
  } else {
    return getAllChildrenContent(ssTemplate).concat(scanSlotScopedText(ssTemplate))
  }

}



function findTextInVue(code: string, filename: string) {
  const matches = []
  // 处理实体字符空格问题
  const rexSpace1 = new RegExp(/&ensp;/, 'g')
  const rexSpace2 = new RegExp(/&emsp;/, 'g')
  const rexSpace3 = new RegExp(/&nbsp;/, 'g')
  const repSpace1 = new RegExp(/ccsp&;/, 'g')
  const repSpace2 = new RegExp(/ecsp&;/, 'g')
  const repSpace3 = new RegExp(/ncsp&;/, 'g')
  code = code.replace(rexSpace1, 'ccsp&;').replace(rexSpace2, 'ecsp&;').replace(rexSpace3, 'ncsp&;')
  
  const vueObject = vueCompiler.compile(code.toString(), { outputSourceRange: true })
  const vueAst = vueObject.ast
  let textList = getAllChildrenContent(vueAst)
  const sfc = vueCompiler.parseComponent(code.toString());
  const scriptText = sfc.script ? findTextInVueTs(sfc.script.content, filename, sfc.script.start) : []
  textList = textList.concat(scriptText)
  textList.sort((prev, next) => {
    return prev.start - next.start
  })
  
  matches.push(...textList.map(item => {
    const { start, end, range } = item
    return {
      ...item,
      range: range || {
        start, end
      },
      text: item.text.replace(repSpace1, '&ensp;').replace(repSpace2, '&emsp;').replace(repSpace3, '&nbsp;')
    }
  }))
  return matches
}

/*
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
