declare module "app" {
    import { CouchDoc } from "davenport"

    export interface User extends CouchDoc {
        hashed_password: string;
    }

    export interface Punch extends CouchDoc {
        user_id: string
        start_date: number
        end_date?: number
    }

    export interface Week {
        label: string
        punches: Punch[]
    }
}

declare module "requests" {
    export interface GetPutDelete {
        id: string
    }
}

declare module "requests/auth" {
    export interface LoginOrRegister {
        username: string
        password: string
    }

    export { GetPutDelete } from "requests"
}

declare module "requests/punches" {
    import { Week } from "app";

    export { GetPutDelete } from "requests";

    export interface PunchOutQuery {
        rev: string
    }

    export interface ListResponse {
        current: Punch[]
        previous: Week[]
    }
}