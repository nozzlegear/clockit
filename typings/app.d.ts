declare module "app" {
    import { CouchDoc } from "davenport"

    export interface User extends CouchDoc {
        hashed_password: string;
    }

    export interface Punch extends CouchDoc {
        start_date: number
        end_date: number
    }

    export interface Week {
        label: string
        punches: Punch[]
    }
}

declare module "requests/auth" {
    export interface LoginOrRegister {
        username: string
        password: string
    }
}