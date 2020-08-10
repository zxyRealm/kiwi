import PagesHomeComponentsFooter from './pages/home/components/footer';
import PagesUtilsIndex from './pages/utils/index';
import PagesApp from './pages/App';
import PagesUserIndex from './pages/user/index';
import PagesHomeLogin from './pages/home/login';
import PagesHomeComponentsHeader from './pages/home/components/header';
import PagesUserText from './pages/user/text';

export default {
  ...PagesHomeComponentsFooter,
  ...PagesUserText,
  ...PagesHomeComponentsHeader,
  ...PagesHomeLogin,
  ...PagesUserIndex,
  ...PagesApp,
  ...PagesUtilsIndex,
};
