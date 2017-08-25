import * as Constants from '../modules/constants';
import * as Davenport from 'davenport';
import inspect from 'logspect';
import { Punch } from 'app';

declare const emit;

class PunchDbWrapper extends Davenport.Client<Punch> {
    constructor() {
        super(Constants.COUCHDB_URL, PunchDbWrapper.Config.name, { warnings: false });
    }

    static get BY_TIMESTAMP_VIEW_NAME(): string {
        return "by-timestamp"
    }

    static get Config(): Davenport.DatabaseConfiguration<Punch> {
        return {
            name: `${Constants.SNAKED_APP_NAME}_punches`,
            designDocs: [{
                name: "list",
                views: [
                    Davenport.GENERIC_LIST_VIEW,
                    {
                        name: PunchDbWrapper.BY_TIMESTAMP_VIEW_NAME,
                        map: function (doc: Punch) {
                            emit(doc.start_date)
                        }.toString()
                    }
                ]
            }]
        }
    }

    get Config(): Davenport.DatabaseConfiguration<Punch> {
        return PunchDbWrapper.Config;
    }

    public async ListPunchesByTimestamp(startTime?: number) {
        const result = await this.viewWithDocs<Punch>("list", PunchDbWrapper.BY_TIMESTAMP_VIEW_NAME, { start_key: startTime });

        return {
            ...result,
            rows: result.rows.map(r => r.doc)
        }
    }
}

export const Punches = new PunchDbWrapper();