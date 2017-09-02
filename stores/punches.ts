import {
    action,
    autorun,
    computed,
    observable
    } from 'mobx';
import { ListResponse } from 'requests/punches';
import { Punch, Week } from 'app';

class PunchStoreFactory {
    constructor() {
        let timer: number | undefined

        autorun(r => {
            if (timer) {
                clearInterval(timer)
            }
            timer = undefined

            const punch = this.current_punch;

            if (punch) {
                timer = setInterval(() => {
                    this.current_punch_seconds = this.calculatePunchSeconds(punch)
                }, 1000) as any
            } else {
                this.current_punch_seconds = 0;
            }
        })
    }

    private calculatePunchSeconds(punch: Punch | undefined) {
        return !!punch ? (punch.end_date || Date.now()) - punch.start_date : 0
    }

    @observable this_weeks_punches: Punch[] = []

    @observable previous_weeks: Week[] = []

    @observable loading = true

    @computed get current_punch(): Punch | undefined {
        // Current punch will be the first one in this week's punches that don't have an end date
        return this.this_weeks_punches.find(i => !i.end_date)
    }

    @observable current_punch_seconds: number = 0

    @action addCurrentPunch(data: Punch) {
        this.this_weeks_punches.push(data);
    }

    @action load(data: ListResponse) {
        console.log("Loading punch store");

        this.this_weeks_punches = data.current.sort((a, b) => b.start_date - a.start_date)
        this.previous_weeks = data.previous.sort((a, b) =>
            b.punches.reduce((highestStart, punch) => highestStart > punch.start_date ? highestStart : punch.start_date, 0)
            -
            a.punches.reduce((highestStart, punch) => highestStart > punch.start_date ? highestStart : punch.start_date, 0)
        )

        this.current_punch_seconds = this.calculatePunchSeconds(this.current_punch)
    }

    @action setLoadingStatus(to: boolean) {
        console.log("Setting Stores.Punches.Loading to :", to);
        this.loading = to;
    }
}

export const Punches = new PunchStoreFactory()