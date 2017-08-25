import * as Constants from '../modules/constants';
import * as Davenport from 'davenport';
import inspect from 'logspect';
import { DisplayIdDesignDoc, Punch } from 'app';

declare const emit;

class PunchDbWrapper extends Davenport.Client<Punch> {
    constructor() {
        super(Constants.COUCHDB_URL, PunchDbWrapper.Config.name, { warnings: false });
    }

    static get Config(): Davenport.DatabaseConfiguration<Punch> {
        return {
            name: `${Constants.SNAKED_APP_NAME}_users`,
            designDocs: [{
                name: "list",
                views: [Davenport.GENERIC_LIST_VIEW]
            }]
        }
    }

    get Config(): Davenport.DatabaseConfiguration<Punch> {
        return PunchDbWrapper.Config;
    }
}

export const Punches = new PunchDbWrapper();