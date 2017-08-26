import * as qs from 'qs';
import * as React from 'react';
import AutoProp from 'auto-prop-component';
import Paths from '../modules/paths';
import { Auth } from '../stores';
import { History } from 'history';

export abstract class AppRouter<IProps, IState> extends AutoProp<IProps, IState> {
    constructor(props: any, context: any) {
        super(props, context);
    }

    static contextTypes = {
        router: React.PropTypes.object
    }

    public context: {
        router: History;
    }

    public state: IState;

    public PATHS = Paths;

    /**
     * Notifies the user that their account has been logged out, and that they must log in again before their request can be made. Returns true if they accept the prompt to log in again, false if not.
     */
    public handleUnauthorized(redirectBackTo?: string, querystring?: Object) {
        if (confirm("Your account has been logged out, and you must log in again before your request can be made. Do you want to log in again?")) {
            window.location.search = qs.stringify({ redirect: redirectBackTo, qs: querystring });

            Auth.logout();

            return true;
        }

        return false;
    }
}

export default AppRouter;