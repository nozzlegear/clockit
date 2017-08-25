import * as React from 'react';
import AuthPage from './pages/auth';
import Background from './pages/universal/background';
import CartDetails from './pages/cart/details';
import CartMain from './pages/cart/main';
import CartName from './pages/cart/name';
import CartShipping from './pages/cart/shipping';
import CartSummary from './pages/cart/summary';
import Confirmed from './pages/confirmation';
import Error from './pages/error/error';
import Frame from './pages/universal/frame';
import Guide from './pages/home/guide';
import History from './pages/history/history';
import Home from './pages/home/home';
import Navbar from './components/nav';
import Orientation from './pages/universal/orientation';
import Paths, { getPathRegex } from './modules/paths';
import Quantities from './pages/universal/quantities';
import Quick from './pages/quick';
import UniversalMain from './pages/universal/main';
import Upload from './pages/universal/upload_images';
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
import { Provider } from 'mobx-react';
import { render as renderComponent } from 'react-dom';

// Inject CSS
require("./css/all.styl");

// Main app component
export default function Main(props) {
    return (
        <main id="app">
            <Navbar />
            {React.cloneElement(props.children, props)}
        </main>
    )
}

export function MinimalMain(props) {
    return (
        <main id="app" className="minimal">
            <div id="body">
                <div className="page-header">
                    <Link to={Paths.home.index}>
                        <img src="/resources/images/kmlogonamewide.png" />
                    </Link>
                </div>
                {React.cloneElement(props.children as any, props)}
            </div>
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
                <Route path={Paths.auth.logout} onEnter={logout} />
                <Route onEnter={checkAuthState} component={Main} >
                    <Route path={Paths.home.index} component={Home} />
                    <Route path={Paths.home.guide} component={Guide} />
                    <Route path={Paths.quick.index} component={Quick} />
                    <Route path={Paths.universal.index} onChange={UniversalMain.routeWillChange} onEnter={UniversalMain.willTransitionTo}>
                        <IndexRoute onEnter={UniversalMain.redirectToLastPage} />
                        <Route path={Paths.universal.frame} component={Frame} />
                        <Route path={Paths.universal.background} component={Background} onEnter={Background.willTransitionTo} />
                        <Route path={Paths.universal.orientation} component={Orientation} onEnter={Orientation.willTransitionTo} />
                        <Route path={Paths.universal.quantity} component={Quantities} onEnter={Quantities.willTransitionTo} />
                        <Route path={Paths.universal.upload} component={Upload} onEnter={Upload.willTransitionTo} />
                    </Route>
                    <Route path={Paths.cart.index} onEnter={CartMain.willTransitionTo}>
                        <IndexRoute component={CartSummary} />
                        <Route path={Paths.cart.name} component={CartName} />
                        <Route path={Paths.cart.shipping} component={CartShipping} />
                        <Route path={Paths.cart.details} component={CartDetails} />
                    </Route>
                    <Route path={Paths.confirmed.index} component={Confirmed} />
                    <Route path={Paths.history.index} component={History} />
                </Route>
                <Route component={MinimalMain}>
                    <Route path={Paths.auth.login} component={AuthPage} />
                </Route>
                <Route path={"/error/:statusCode"} component={Error} />
                <Redirect path={"*"} to={"/error/404"} />
            </Router>
        </Provider>
    )

    renderComponent(routes, document.getElementById("contenthost"));
}