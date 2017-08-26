import * as React from 'react';
import * as Stores from '../stores';
import { Label, PrimaryButton, TextField } from 'office-ui-fabric-react';
import { Link } from 'react-router';

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
                <h2>{`Sign in`}</h2>
                <TextField label="Username" />
                <TextField label="Password" {...{ type: "password" }} />
                <PrimaryButton onClick={() => alert("test")} text="Sign in" />
                <Label>
                    {`Don't have an account? `}
                    <Link to={`#`}>
                        {`Create one!`}
                    </Link>
                </Label>
            </section>
        )
    }
}

export default AuthPage