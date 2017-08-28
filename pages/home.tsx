import * as Clients from '../api';
import * as Constants from '../modules/constants';
import * as React from 'react';
import * as Stores from '../stores';
import { ApiError } from 'gearworks-http/bin';
import { AppRouter } from '../components/approuter';
import { Link } from 'react-router';
import { ListResponse } from 'requests/punches';
import { observer } from 'mobx-react';
import { PrimaryButton, Spinner, SpinnerSize } from 'office-ui-fabric-react';
import { Punch } from 'app';

function PageWrapper(props: React.Props<any>) {
    return (
        <section id="home">
            <h2>{Constants.APP_NAME}</h2>
            <div>
                {props.children}
            </div>
        </section>
    )
}

export interface HomePageState {
    loading: boolean
}

@observer
export class HomePage extends AppRouter<any, Partial<HomePageState>> {
    public state: HomePageState = {
        loading: true
    }

    private formatTimeDigit(digit: number) {
        return digit < 10 ? `0${digit}` : digit.toString()
    }

    private formatTimeString(lengthInMilliseconds: number | undefined) {
        if (lengthInMilliseconds === undefined) {
            return `Calculating...`
        }

        const hourLength = 3600
        const lengthInSeconds = lengthInMilliseconds / 1000;
        const hours = this.formatTimeDigit(Math.floor(lengthInSeconds / hourLength))
        const minutes = this.formatTimeDigit(Math.floor(lengthInSeconds % hourLength / 60))
        const seconds = this.formatTimeDigit(Math.floor(lengthInSeconds % hourLength % 60 % 60))

        return `${hours}:${minutes}:${seconds}`
    }

    private async togglePunch(e: React.MouseEvent<any>) {
        if (this.state.loading) {
            return;
        }

        await this.setState({ loading: true })

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

            if (e.unauthorized && this.handleUnauthorized(this.PATHS.home.index)) {
                return;
            }

            // TODO: Make sure the server returns document conflict errors and display to the user that
            // their current view is out of date.
            alert(e.message)

            return;
        } finally {
            this.setState({ loading: false });
        }

        // push the result to the mobx store of current punches
        Stores.Punches.addCurrentPunch(result)

        // Load the current list again (in case the week has changed, client isn't on the same device, etc)
        try {
            const list = await client.listPunches();

            Stores.Punches.load(list);
        } catch (_e) {
            const e: ApiError = _e;

            if (e.unauthorized && this.handleUnauthorized(this.PATHS.home.index)) {
                return;
            }

            alert(e.message);

            return;
        }
    }

    public async componentDidMount() {
        const client = new Clients.PunchClient(Stores.Auth.token)

        try {
            const punches = await client.listPunches();

            Stores.Punches.load(punches);
        } catch (_e) {
            const e: ApiError = _e;

            if (e.unauthorized && this.handleUnauthorized(this.PATHS.home.index)) {
                return
            }

            alert(e.message);
        } finally {
            this.setState({ loading: false });
        }
    }

    public render() {
        const now = Date.now();
        const punch = Stores.Punches.current_punch;

        if (this.state.loading) {
            return <PageWrapper><Spinner label={`Loading previous punches, please wait.`} /></PageWrapper>
        }

        return (
            <PageWrapper>
                <h1>
                    {
                        !!punch ?
                            this.formatTimeString(Stores.Punches.current_punch_seconds) :
                            "You are not punched in."
                    }
                </h1>
                <PrimaryButton onClick={e => this.togglePunch(e)} text={punch ? `Punch Out` : `Punch In`} />
                {Stores.Punches.this_weeks_punches.map(punch => {
                    const endTime = punch.end_date || now

                    return (
                        <div key={punch._id}>
                            <div className="previous-record">
                                <div className="time">
                                    {this.formatTimeString(endTime - punch.start_date)}
                                </div>
                                <div className="date">
                                    {new Date(punch.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <h2>{`Previous Weeks`}</h2>
                {
                    Stores.Punches.previous_weeks.map(week =>
                        <div className="week">
                            <div className="label">{week.label}</div>
                            <div className="length">
                                {this.formatTimeString(week.punches.reduce((total, punch) => (punch.end_date || now) - punch.start_date, 0))}
                            </div>
                        </div>
                    )
                }
                <p className="more">
                    <Link to={this.PATHS.home.week}>
                        {`More`}
                    </Link>
                </p>
            </PageWrapper>
        )
    }
}

export default HomePage