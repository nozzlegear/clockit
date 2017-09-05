import {
    action,
    autorun,
    computed,
    observable
    } from 'mobx';
import { AUTH_STORAGE_NAME } from '../modules/constants';
import { decode } from 'jwt-simple';
import { SessionToken } from 'gearworks-route';
import { User } from 'app';

class AuthStoreFactory {
    constructor() {
        this.token = localStorage.getItem(AUTH_STORAGE_NAME) || "";

        if (this.token) {
            this.session = decode(this.token, undefined, true);
        }

        autorun("AuthStore-autorun", (runner) => {
            // Persist the auth changes to localstorage
            localStorage.setItem(AUTH_STORAGE_NAME, this.token);
        });
    }

    @observable token: string;

    @observable session: SessionToken<User>;

    @computed get sessionIsInvalid() {
        return !this.token || !this.session || (this.session.exp * 1000 < Date.now());
    }

    @action login(token: string) {
        this.session = decode(token, undefined, true);

        this.token = token;
    }

    @action logout() {
        this.session = {} as any;
        this.token = "";
    }
}

export const Auth = new AuthStoreFactory();