import * as React from 'react';
import * as Stores from '../stores';
import { ActionButton } from 'office-ui-fabric-react';

export interface AuthPageState {
    loading: boolean
}

export class AuthPage extends React.Component<any, Partial<AuthPageState>> {
    public state: AuthPageState = {
        loading: false
    }

    render() {
        return (
            <section id="login">

            </section>
        )
    }
}

export default AuthPage