import * as classNames from 'classnames';
import * as Clients from '../api';
import * as Constants from '../modules/constants';
import * as React from 'react';
import * as Stores from '../stores';
import PATHS from '../modules/paths';
import { ApiError } from 'gearworks-http/bin';
import { AppRouter } from '../components/approuter';
import { handleUnauthorized } from '../modules/unauthorized';
import { Link } from 'react-router';
import { ListResponse } from 'requests/punches';
import { observer } from 'mobx-react';
import { PrimaryButton, Spinner, SpinnerSize } from 'office-ui-fabric-react';
import { Punch } from 'app';

function formatTimeDigit(digit: number) {
    return digit < 10 ? `0${digit}` : digit.toString()
}

function formatTimeString(lengthInMilliseconds: number | undefined) {
    if (lengthInMilliseconds === undefined) {
        return `Calculating...`
    }

    const hourLength = 3600
    const lengthInSeconds = lengthInMilliseconds / 1000;
    const hours = formatTimeDigit(Math.floor(lengthInSeconds / hourLength))
    const minutes = formatTimeDigit(Math.floor(lengthInSeconds % hourLength / 60))
    const seconds = formatTimeDigit(Math.floor(lengthInSeconds % hourLength % 60 % 60))

    return `${hours}:${minutes}:${seconds}`
}

async function togglePunch(e: React.MouseEvent<any>) {
    if (Stores.Punches.loading) {
        return;
    }

    Stores.Punches.setLoadingStatus(true);

    const client = new Clients.PunchClient(Stores.Auth.token);
    let result: Punch;

    try {
        if (Stores.Punches.current_punch) {
            // Need to punch out and delete the localstorage value
            const current = Stores.Punches.current_punch;
            result = await client.punchOut(current._id as string, current._rev as string)

            localStorage.removeItem(Constants.CURRENT_PUNCH_NAME)
        } else {
            // Need to punch in and save the localstorage value
            result = await client.punchIn();

            localStorage.setItem(Constants.CURRENT_PUNCH_NAME, JSON.stringify(""));
        }
    } catch (_e) {
        const e: ApiError = _e;

        if (e.unauthorized && handleUnauthorized(PATHS.home.index)) {
            return;
        }

        // TODO: Make sure the server returns document conflict errors and display to the user that
        // their current view is out of date.
        alert(e.message)

        return;
    } finally {
        Stores.Punches.setLoadingStatus(false);
    }

    // push the result to the mobx store of current punches
    Stores.Punches.addCurrentPunch(result)

    // Load the current list again (in case the week has changed, client isn't on the same device, etc)
    try {
        const list = await client.listPunches();

        Stores.Punches.load(list);
    } catch (_e) {
        const e: ApiError = _e;

        if (e.unauthorized && handleUnauthorized(PATHS.home.index)) {
            return;
        }

        alert(e.message);

        return;
    }
}

let hasPreviouslyRunFirstMount = false;

async function runFirstMount() {
    if (hasPreviouslyRunFirstMount) {
        return;
    }

    Stores.Punches.setLoadingStatus(true);
    hasPreviouslyRunFirstMount = true;

    const client = new Clients.PunchClient(Stores.Auth.token)

    try {
        const punches = await client.listPunches();

        Stores.Punches.load(punches);
    } catch (_e) {
        const e: ApiError = _e;

        if (e.unauthorized && handleUnauthorized(PATHS.home.index)) {
            return
        }

        alert(e.message);
    } finally {
        Stores.Punches.setLoadingStatus(false);
    }
}

function PageWrapper(props: React.Props<any>) {
    return (
        <section id="home">
            {props.children}
        </section>
    )
}

function TimeDisplay(props: React.Props<any> & { time: string, since: string }) {
    const empty = !props.children;

    return (
        <div className={classNames("time-display", { empty })}>
            <h1 className="app-title">{Constants.APP_NAME}</h1>
            <h2 className="length">
                {props.time}
                {
                    !empty ?
                        <small className="since">{`since ${props.since}.`}</small>
                        : null
                }
            </h2>
            {
                !empty ?
                    <div className="actions">
                        {props.children}
                    </div>
                    : null
            }
        </div>
    )
}

function PunchDisplay(props: React.Props<any> & { punch: Punch, active: boolean }) {
    const { punch, active } = props;
    const endTime = punch.end_date || Date.now();

    return (
        <div className={classNames("punch", { active })} key={punch._id}>
            <div className="time">
                {formatTimeString(endTime - punch.start_date)}
            </div>
            <div className="date">
                {new Date(punch.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
        </div>
    )
}

export const HomePage = observer((props: React.Props<any>) => {
    const punch = Stores.Punches.current_punch;
    const since = Stores.Punches.start_of_week;
    const now = Date.now();

    if (Stores.Punches.loading) {
        return (
            <PageWrapper ref={r => runFirstMount()}>
                <TimeDisplay time="..." since={since}>
                    <Spinner label={`Loading previous punches, please wait.`} />
                </TimeDisplay>
            </PageWrapper>
        )
    }

    return (
        <PageWrapper ref={r => runFirstMount()}>
            <TimeDisplay time={formatTimeString(Stores.Punches.total_seconds_for_week)} since={since}>
                <PrimaryButton onClick={e => togglePunch(e)} text={!!punch ? `Punch Out` : `Punch In`} />
            </TimeDisplay>
            <div className="punches">
                {
                    Stores.Punches.current_punch ?
                        <PunchDisplay punch={Stores.Punches.current_punch} active={true} />
                        : null
                }
                {Stores.Punches.this_week.map(punch => <PunchDisplay key={punch._id} punch={punch} active={false} />)}
            </div>
            <h2>{`Previous Weeks`}</h2>
            {
                Stores.Punches.last_four_weeks.map(week =>
                    <div className="week">
                        <div className="label">{week.label}</div>
                        <div className="length">
                            {formatTimeString(week.punches.reduce((total, punch) => (punch.end_date || now) - punch.start_date, 0))}
                        </div>
                    </div>
                )
            }
            <p className="more">
                <Link to={PATHS.home.week}>
                    {`More`}
                </Link>
            </p>
        </PageWrapper>
    )
})

export default HomePage