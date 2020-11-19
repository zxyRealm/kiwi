# 🐤 kiwi cli

Kiwi 的 CLI 工具

## 如何使用

> yarn global add uniubi-kiwi-clis



> 推荐与[🐤 Kiwi-国际化全流程解决方案](https://github.com/alibaba/kiwi)结合使用

```txt
# .gitignore 文件中添加以下过滤规则

/*.xlsx
export-*.txt
/export-excel
/export-excel-*

```

## CLI 参数

### kiwi `--init`

初始化项目，生成 kiwi 的配置文件 `kiwi-config.json`

```js
{
  // kiwi文件根目录，用于放置提取的langs文件
  "kiwiDir": "./.kiwi",

  // 配置文件目录，若调整配置文件，此处可手动修改
  "configFile": "./.kiwi/kiwi-config.json",

  // 语言目录名，注意连线和下划线
  "srcLang": "zh-CN",
  "distLangs": ["en", "zh-CN"],
  // --update 功能中读取 excel 时 key: value 对应列的索引
  "excelOptions": {
      "keyIndex": 0,
      "valueIndex": 1
  },
   // google-translate-open-api 插件配置项
  "translateOptions": {
       "browersUrl": "https://cors-anywhere.herokuapp.com/", // 默认在线代理地址
       "browers": true // 是否开在线代理（google翻译存在机器人检测机制，长时间使用会被禁用）
  },
  // import 语句，不同项目请自己配置
  "importI18N": "",

  // 可跳过的文件夹名或者文加名，比如docs、mock等
  "include": ["src"],
  "exclude": ["node_modules"]
}
```



### kiwi `--extract`

一键批量替换指定文件夹下的所有文案

```shell script
kiwi --extract [dirPath]
```

![批量替换](https://raw.githubusercontent.com/alibaba/kiwi/master/kiwi-cli/public/extract.gif)



> 长时间使用会存在 google 翻译被禁用的情况， 如出现 429 等错误。 此时的处理方式可以选择关闭在线代理或者更换在线代理地址


### kiwi `--export`

```
# 导出指定语言的文案，lang取值为配置中distLangs值，如en-US导出还未翻译成英文的中文文案
kiwi --export [filePath] en-US
```

导出未翻译的文案



### kiwi `--excel`

将语言包按照语言类型导出成单个excel



### kiwi `--compare`

根据导出的 excel, 对比不同语言类型和基础语言包之间的差异



### kiwi  `--update`

```
# 优先同步源语言包与其他语言包的 key: value 映射关系，根据 excel 更新语言包中 key 对应的 value 值，默认会先将其他语言包中 key 与基础语言包进行一次同步处理
kiwi --update [filePath] [lang]

```


