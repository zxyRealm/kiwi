import * as React from 'react';
import I18N from './I18N';

class Login extends React.Component {
  render() {
    return (
      <div>
        <h2>{I18N.login.js.user_login_title}</h2>
      </div>
    )
  }
}

export default Login
