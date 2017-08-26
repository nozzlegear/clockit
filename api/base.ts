import * as Constants from '../modules/constants';
import Client from 'gearworks-http';

export class BaseClient extends Client {
    constructor(path: string, authToken?: string) {
        super(`/api/v1/${path}`, !!authToken ? { [Constants.AUTH_HEADER_NAME]: authToken } : undefined)
    }
}