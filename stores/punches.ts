import { computed, observable } from 'mobx';
import { Punch, Week } from 'app';

class PunchStoreFactory {
    constructor() {

    }

    @observable punches: Punch[] = []

    @computed get previousWeeks(): Week[] {

        return []
    }
}

export const Punches = new PunchStoreFactory()