import * as React from 'react';
import * as Stores from '../stores';
import { ActionButton, TextField } from 'office-ui-fabric-react';

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
                <TextField label="Username" />
                <TextField label="Password" type="password" />
            </section>
        )
    }
}

export default AuthPage