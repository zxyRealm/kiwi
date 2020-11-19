#!/usr/bin/env node

import * as commander from 'commander';
import * as inquirer from 'inquirer';
import { initProject } from './init';
import { sync } from './sync';
import { exportMessages } from './export';
import { importMessages } from './import';
import { exportExcel } from './excel-export'
import { compareExcel } from './excel-compare'
import { findUnUsed } from './unused';
import { mockLangs } from './mock';
import { extractAll } from './extract/extract';
import { update } from './update'
import * as ora from 'ora';

/**
 * 进度条加载
 * @param text
 * @param callback
 */
function spining(text, callback) {
  const spinner = ora(`${text}中...`).start();
  if (callback) {
    callback();
  }
  spinner.succeed(`${text}成功`);
}

commander
  .version('0.2.4')
  .option('--init', '初始化项目', { isDefault: true })
  .option('--import [file] [lang]', '导入翻译文案')
  .option('--export [file] [lang]', '导出未翻译的文案')
  .option('--excel [langDir] [lang]', '导出 excel')
  .option('--compare [originFile] [targetFile]', '对比导出 key 差异')
  .option('--update [file] [lang]', '更新语言包')
  .option('--sync', '同步各种语言的文案')
  .option('--mock', '使用 Google 翻译')
  .option('--unused', '导出未使用的文案')
  .option('--extract [dirPath]', '一键替换指定文件夹下的所有中文文案')
  .parse(process.argv);

if (commander.init) {
  (async () => {
    const result = await inquirer.prompt({
      type: 'confirm',
      name: 'confirm',
      default: true,
      message: '项目中是否已存在kiwi相关目录？'
    });

    if (!result.confirm) {
      spining('初始化项目', async () => {
        initProject();
      });
    } else {
      const value = await inquirer.prompt({
        type: 'input',
        name: 'dir',
        message: '请输入相关目录：'
      });
      spining('初始化项目', async () => {
        initProject(value.dir);
      });
    }
  })();
}

if (commander.compare) {
  spining('对比导出excel 中 key 差异', () => {
    if (commander.compare === true || commander.args.length === 0) {
      console.log('请按格式输入：--compare originFile targetFile');
    } else if (commander.args) {
      compareExcel(commander.compare, commander.args[0]);
    }
  });
}

if (commander.excel) {
  spining('导出 excel', () => {
    exportExcel(commander.args.length && commander.excel, commander.args && commander.args[0])
  });
}

if (commander.import) {
  spining('导入翻译文案', () => {
    if (commander.import === true || commander.args.length === 0) {
      console.log('请按格式输入：--import [file] [lang]');
    } else if (commander.args) {
      importMessages(commander.import, commander.args[0]);
    }
  });
}

if (commander.export) {
  spining('导出未翻译的文案', () => {
    if (commander.export === true && commander.args.length === 0) {
      exportMessages();
    } else if (commander.args) {
      exportMessages(commander.export, commander.args[0]);
    }
  });
}

if (commander.sync) {
  spining('文案同步', () => {
    sync();
  });
}

if (commander.update) {
  spining('文案更新', () => {
    if (commander.update === true && commander.args.length === 0) {
      update();
    } else if (commander.args.length) {
      update(commander.update, ...commander.args);
    } else {
      console.warn('请按格式输入：--update [file] [lang]');
    }
  });
}

if (commander.unused) {
  spining('导出未使用的文案', () => {
    findUnUsed();
  });
}

if (commander.mock) {
  const spinner = ora('使用 Google 翻译中...').start();
  sync(async () => {
    await mockLangs();
    spinner.succeed('使用 Google 翻译成功');
  });
}

if (commander.extract) {
  if (commander.extract === true) {
    extractAll();
  } else {
    extractAll(commander.extract);
  }
}
