import { BaseClient } from './base';
import { Punch } from 'app';

export class PunchClient extends BaseClient {
    constructor(authToken: string) {
        super("punches", authToken)
    }

    public punchIn() {
        return this.sendRequest<Punch>("", "POST")
    }

    public punchOut(id: string) {
        return this.sendRequest<Punch>(id, "PUT")
    }
}