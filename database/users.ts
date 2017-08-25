import * as Constants from '../modules/constants';
import * as Davenport from 'davenport';
import inspect from 'logspect';
import { DisplayIdDesignDoc, User } from 'app';

declare const emit;

class UserDbWrapper extends Davenport.Client<User> {
    constructor() {
        super(Constants.COUCHDB_URL, UserDbWrapper.Config.name, { warnings: false });
    }

    static get Config(): Davenport.DatabaseConfiguration<User> {
        return {
            name: `${Constants.SNAKED_APP_NAME}_users`,
            designDocs: [{
                name: "list",
                views: [Davenport.GENERIC_LIST_VIEW]
            }]
        }
    }

    get Config(): Davenport.DatabaseConfiguration<User> {
        return UserDbWrapper.Config;
    }
}

export const Users = new UserDbWrapper();