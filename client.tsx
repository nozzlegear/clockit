import * as React from 'react';
import AuthPage from './pages/auth';
import ErrorPage from './pages/error';
import HomePage from './pages/home';
import Paths from './modules/paths';
import { APP_NAME } from './modules/constants';
import { Auth as AuthStore } from './stores';
import {
    browserHistory,
    IndexRedirect,
    IndexRoute,
    Link,
    Redirect,
    Route,
    Router
    } from 'react-router';
import { Fabric } from 'office-ui-fabric-react';
import { Provider } from 'mobx-react';
import { render as renderComponent } from 'react-dom';

// Inject CSS
require("./css/all.styl");

// Main app component
export default function Main(props) {
    return (
        <main id="app">
            {React.cloneElement(props.children, props)}
        </main>
    )
}

{
    function checkAuthState(args: Router.RouterState, replace: Router.RedirectFunction, callback: Function) {
        if (AuthStore.sessionIsInvalid) {
            replace(Paths.auth.login + window.location.search);
        }

        callback();
    }

    function logout(args: Router.RouterState, replace: Router.RedirectFunction, callback: Function) {
        AuthStore.logout();
        replace(Paths.auth.login);

        callback();
    }

    const routes = (
        <Provider>
            <Router history={browserHistory}>
                <Fabric>
                    <Route path={Paths.auth.logout} onEnter={logout} />
                    <Route onEnter={checkAuthState} component={Main} >
                        <Route path={Paths.home.index} component={HomePage} />
                    </Route>
                    <Route component={Main}>
                        <Route path={Paths.auth.login} component={AuthPage} />
                    </Route>
                    <Route path={"/error/:statusCode"} component={ErrorPage} />
                    <Redirect path={"*"} to={"/error/404"} />
                </Fabric>
            </Router>
        </Provider>
    )

    renderComponent(routes, document.getElementById("contenthost"));
}