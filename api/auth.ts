import * as Requests from 'requests/auth';
import { BaseClient } from './base';
import { SessionToken } from 'gearworks-route/bin';
import { User } from 'app';

export class AuthClient extends BaseClient {
    constructor() {
        super("auth")
    }

    public createSession = (data: Requests.LoginOrRegister) => this.sendRequest<{ token: string }>("", "POST", { body: data })

    public createUser = (data: Requests.LoginOrRegister) => this.sendRequest<{ token: string }>("register", "POST", { body: data })
}