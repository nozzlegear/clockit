import {
    action,
    autorun,
    computed,
    observable
    } from 'mobx';
import { getClosestSunday } from '../modules/dates';
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

    @observable this_week: Punch[] = []

    @observable last_four_weeks: Week[] = []

    @observable current_punch: Punch | undefined = undefined

    @observable loading = true

    @observable current_punch_seconds: number = 0

    @computed get start_of_week(): string {
        const earliestDate = this.this_week.reduce<number>((smallest, punch) => {
            return punch.start_date > smallest ? punch.start_date : smallest;
        }, Date.now());
        const sunday = getClosestSunday(new Date(earliestDate));

        return sunday.toLocaleDateString("en-US", { weekday: "long", month: "short", year: "numeric", day: "numeric" });
    }

    @computed get total_seconds_for_week(): number {
        const seconds = this.this_week
            .filter(i => i._id !== (this.current_punch && this.current_punch._id || undefined))
            .reduce<number>((total, punch) => total + this.calculatePunchSeconds(punch), 0)

        // Must have a dependency on this.current_punch_seconds so it gets updated when that value does too.
        return seconds + this.current_punch_seconds;
    }

    @action addCurrentPunch(data: Punch) {
        this.this_week.push(data);
    }

    @action load(data: ListResponse) {
        this.this_week = data.this_week.sort((a, b) => b.start_date - a.start_date)
        this.last_four_weeks = data.last_four_weeks.sort((a, b) =>
            b.punches.reduce((highestStart, punch) => highestStart > punch.start_date ? highestStart : punch.start_date, 0)
            -
            a.punches.reduce((highestStart, punch) => highestStart > punch.start_date ? highestStart : punch.start_date, 0)
        )
        this.current_punch = data.open
        this.current_punch_seconds = this.calculatePunchSeconds(this.current_punch)
    }

    @action setLoadingStatus(to: boolean) {
        this.loading = to;
    }
}

export const Punches = new PunchStoreFactory()