/**
 * @author doubledream
 * @desc 文件处理方法
 */

import * as path from 'path';
import * as _ from 'lodash';
import * as fs from 'fs-extra';
import * as dirs from 'node-dir'
import * as slash from 'slash2';

/*
 * 获取文件夹下符合要求的所有文件
 * @function getSpecifiedFiles
 * @param  {string} dir 路径
 * @param {ignoreDirectory} 忽略文件夹 {ignoreFile} 忽略的文件
 */
function getSpecifiedFiles(dir, includeOption = '', excludeOption = ''): string[] {
  const files = dirs.files(dir, {
    sync: true
  })
  return files
    .map(f => slash(f))
    .filter(file => {
      // 处理文件过滤规则
      // 
      const validateRule = (rule, str) => {
        // 当 rule 为 string 并且不是一个文件时，将其转换为一个正则表达式
        const isFile = rule.split && rule.split('/')[rule.split('/').length - 1].includes('.')
        const reg = typeof rule === 'string' && new RegExp(`${rule.replace(/\/$/, '')}${!isFile ? '(?=\/)' : ''}`)
        const stringRule = typeof rule === 'string' && reg.test(str)
        const regRule = rule.test && rule.test(str)
        return stringRule || regRule
      }
      // 包含文件或目录
      const include = () => {
        let isValidate = false
        if (Array.isArray(includeOption)) {
          includeOption.forEach(item => {
            const valid = validateRule(item, file)
            if (valid) isValidate = true
          })
        } else if (typeof includeOption === 'string') {
          const valid = validateRule(includeOption, file)
          if (valid) isValidate = true
        }
        return isValidate
      }
      // 要忽略的文件或目录
      const exclude = () => {
        let isIgnore = false
        if (Array.isArray(excludeOption)) {
          excludeOption.forEach(item => {
            const valid = validateRule(item, file)
            if (valid) isIgnore = true
          })
        } else if (typeof excludeOption === 'string') {
          const valid = validateRule(excludeOption, file)
          if (valid) isIgnore = true
        }
        return isIgnore
      }
      return include() && !exclude() 
  })
  // return fs.readdirSync(dir).reduce((files, file) => {
  //   const name = path.join(dir, file);
  //   const isDirectory = fs.statSync(name).isDirectory();
  //   const isFile = fs.statSync(name).isFile();
  //   files = files.map(f => slash(f))
  //   if (isDirectory) {
  //     return files.concat(getSpecifiedFiles(name, ignoreDirectory, ignoreFile));
  //   }

  //   const isIgnoreDirectory =
  //     !ignoreDirectory ||
  //     (ignoreDirectory &&
  //       !path
  //         .dirname(name)
  //         .split('/')
  //         .includes(ignoreDirectory));
  //   const isIgnoreFile = !ignoreFile || (ignoreFile && path.basename(name) !== ignoreFile);

  //   if (isFile && isIgnoreDirectory && isIgnoreFile) {
  //     return files.concat(name);
  //   }
  //   return files;
  // }, []);
}

// 获取符合过滤条件的所有文件
// function 

/*
 * 读取文件
 * @param fileName
 */
function readFile(fileName) {
  if (fs.existsSync(fileName)) {
    return fs.readFileSync(fileName, {
      encoding: 'utf8'
    });
  }
}

/**
 * 写入文件
 * @param filePath 文件路径
 */
function writeFile(filePath, file) {
  if (file) {
    fs.outputFileSync(filePath, file);
  }
}

export { getSpecifiedFiles, readFile, writeFile };
