import common from './common';
import test from './test';
import i18n from './i18n';
import src from './src';
import ml_parser from './ml_parser';
import zh_TW from './zh_TW';
import login from './login';
import extract from './extract';

function loadLocaleMessages (): object {
  const locales = require.context('./', true, /[A-Za-z0-9-_,\s]+\.js$/i)
  const messages = {}
  console.log('locales', locales)
  locales.keys().forEach((key: string) => {
    const matched = key.match(/([A-Za-z0-9-_]+)\./i)
    if (matched && matched.length > 1) {
      const locale = matched[1]
      messages[locale] = locales(key)
    }
  })
  return messages
}

export default Object.assign({}, {
  common,
  ...loadLocaleMessages,
  extract,
  login,
  zh_TW,
  ml_parser,
  src,
  i18n,
  test,
});