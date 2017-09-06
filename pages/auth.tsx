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
import { SessionTokenResponse } from 'gearworks-route/bin';

export interface AuthPageProps extends React.ClassAttributes<AuthPage> {
    type: "login" | "register"
}

export interface AuthPageState {
    loading: boolean;
    error: string | undefined;
    username: string;
    password: string;
}

export class AuthPage extends AppRouter<AuthPageProps, Partial<AuthPageState>> {
    public state: AuthPageState = {
        loading: false,
        error: undefined,
        username: "",
        password: ""
    }

    private async loginOrRegister(e: React.MouseEvent<any>) {
        e.preventDefault();

        if (this.state.loading) {
            return;
        }

        const isLoginPage = this.props.type === "login";
        const { username, password } = this.state;

        this.setState({ ...this.state, loading: true, error: undefined })

        const client = new AuthClient();
        let token: SessionTokenResponse;

        try {
            if (isLoginPage) {
                token = await client.createSession({
                    username,
                    password
                })
            } else {
                token = await client.createUser({
                    username,
                    password
                })
            }

            Auth.login(token.token);

            this.context.router.push(this.PATHS.home.index)
        } catch (_e) {
            const e: ApiError = _e;

            this.setState({ ...this.state, loading: false, error: e.message })
        }
    }

    public render() {
        const isLoginPage = this.props.type === "login";
        const { username, password, loading, error, ...state } = this.state;

        return (
            <section id="auth">
                <h2 className="page-title">{isLoginPage ? `Sign in` : `Create an account`}</h2>
                {error ?
                    <MessageBar messageBarType={MessageBarType.error}>
                        {error}
                    </MessageBar> :
                    null
                }
                <div className="controls">
                    <TextField label="Username" value={username} onChanged={value => this.setState({ username: value })} />
                    <TextField label="Password" type="password" value={password} onChanged={value => this.setState({ password: value })} />
                </div>
                {loading ?
                    <Spinner label={isLoginPage ? `Signing in...` : `Creating account...`} /> :
                    <div className="actions">
                        <PrimaryButton text={isLoginPage ? `Sign in` : "Create account"} buttonType={ButtonType.normal} type="button" onClick={e => this.loginOrRegister(e)} />
                        <Label>
                            {isLoginPage ? `Don't have an account? ` : `Already have an account? `}
                            <Link to={isLoginPage ? Paths.auth.register : Paths.auth.login}>
                                {isLoginPage ? `Create one!` : `Sign in!`}
                            </Link>
                        </Label>
                    </div>
                }
            </section>
        )
    }
}

export default AuthPage