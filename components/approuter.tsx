import * as qs from 'qs';
import * as React from 'react';
import AutoProp from 'auto-prop-component';
import Paths from '../modules/paths';
import { Auth } from '../stores';
import { handleUnauthorized } from '../modules/unauthorized';
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

    public handleUnauthorized = handleUnauthorized
}

export default AppRouter;