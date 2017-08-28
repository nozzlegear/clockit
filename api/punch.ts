import * as Requests from 'requests/punches';
import { BaseClient } from './base';
import { Punch } from 'app';

export class PunchClient extends BaseClient {
    constructor(authToken: string) {
        super("punches", authToken)
    }

    public punchIn() {
        return this.sendRequest<Punch>("", "POST")
    }

    public punchOut(id: string, rev: string) {
        return this.sendRequest<Punch>(id, "PUT", { qs: { rev } })
    }

    public listPunches() {
        return this.sendRequest<Requests.ListResponse>("", "GET");
    }
}