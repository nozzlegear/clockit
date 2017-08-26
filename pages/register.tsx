import * as React from 'react';
import { ApiError } from 'gearworks-http/bin';
import { AppRouter } from '../components/approuter';
import { Auth } from '../stores/index';
import { AuthClient } from '../api/auth';
import {
    ButtonType,
    Label,
    MessageBar,
    MessageBarType,
    PrimaryButton,
    Spinner,
    TextField
    } from 'office-ui-fabric-react';
import { Link } from 'react-router';
import { Paths } from '../modules/paths';

export interface RegisterPageState {
    loading: boolean;
    error: string | undefined;
    username: string;
    password: string;
}

export class RegisterPage extends AppRouter<any, Partial<RegisterPageState>> {
    public state: RegisterPageState = {
        loading: false,
        error: undefined,
        username: "",
        password: ""
    }

    private async createUser(e: React.MouseEvent<any>) {
        e.preventDefault();

        if (this.state.loading) {
            return;
        }

        const { username, password } = this.state;

        console.log("State is", this.state);

        this.setState({ ...this.state, loading: true, error: undefined })

        const client = new AuthClient();

        try {
            const token = await client.createUser({
                username,
                password
            })

            Auth.login(token.token);

            this.context.router.push(this.PATHS.home.index)
        } catch (_e) {
            const e: ApiError = _e;

            this.setState({ ...this.state, loading: false, error: e.message })
        }
    }

    public render() {
        const { username, password, loading, error, ...state } = this.state;

        return (
            <section id="register">
                <h2>{`Create an account`}</h2>
                {error ?
                    <MessageBar messageBarType={MessageBarType.error}>
                        {error}
                    </MessageBar> :
                    null
                }
                <TextField label="Username" value={username} onChanged={value => this.setState({ username: value })} />
                <TextField label="Password" type="password" value={password} onChanged={value => this.setState({ password: value })} />
                {loading ?
                    <Spinner label="Creating account..." /> :
                    <div>
                        <PrimaryButton text="Create account" buttonType={ButtonType.normal} type="button" onClick={e => this.createUser(e)} />
                        <Label>
                            {`Already have an account? `}
                            <Link to={Paths.auth.login}>
                                {`Sign in!`}
                            </Link>
                        </Label>
                    </div>
                }
            </section>
        )
    }
}

export default RegisterPage