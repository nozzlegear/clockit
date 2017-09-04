import * as boom from 'boom';
import * as gv from 'gearworks-validation';
import * as requests from 'requests/punches';
import { Express } from 'express';
import { getClosestSunday, getWeekNumber } from '../modules/dates';
import { Punch, User, Week } from 'app';
import { Punches } from '../database';
import { RouterFunction, RouterRequest, RouterResponse } from 'gearworks-route';

const BASE_PATH = "/api/v1/punches/";

const PATH_REGEX = /\/api\/v1\/punches*?/i;

export function registerPunchRoutes(app: Express, router: RouterFunction<User>) {
    function isValidUser(user: User | undefined): user is User {
        return !!user && typeof (user._id) === "string"
    }

    function isValidUserId(id: string | undefined): id is string {
        return typeof (id) === "string"
    }

    function badUserBoom() {
        return boom.expectationFailed(`Request passed authorization, but req.user or req.user._id was null or undefined.`)
    }

    function matchOpenPunch(p: Punch) {
        return p.end_date === undefined || p.end_date === null;
    }

    router({
        label: "List punches and weeks",
        path: BASE_PATH,
        method: "get",
        requireAuth: true,
        handler: async function (req, res, next) {
            const user = req.user;

            if (!isValidUser(user) || !isValidUserId(user._id)) {
                return next(badUserBoom());
            }

            const startOfWeek = getClosestSunday()
            const fourWeeksAgo = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth() - 1)
            const currentPeriod = await Punches.listPunchesByTimestamp(user._id, { startTime: startOfWeek.getTime(), endTime: Date.now() });
            const last4Weeks = await Punches.listPunchesByTimestamp(user._id, { startTime: fourWeeksAgo.getTime(), endTime: startOfWeek.getTime() })
            let openPunch: Punch | undefined = undefined

            // Check for an open punch and remove it from its array
            if (currentPeriod.rows.some(matchOpenPunch)) {
                const index = currentPeriod.rows.findIndex(matchOpenPunch);

                openPunch = currentPeriod.rows.splice(index, 1)[0];
            } else if (last4Weeks.rows.some(matchOpenPunch)) {
                const index = last4Weeks.rows.findIndex(matchOpenPunch);

                openPunch = last4Weeks.rows.splice(index, 1)[0];
            }

            res.json<requests.ListResponse>({
                open: openPunch,
                this_week: currentPeriod.rows,
                last_four_weeks: last4Weeks.rows.reduce<Week[]>((weeks, punch) => {
                    const { year, week } = getWeekNumber(punch.start_date);
                    const label = `${year}-${week}`
                    const index = weeks.findIndex(w => w.label === label)

                    if (index === -1) {
                        weeks.push({
                            label,
                            punches: [punch]
                        })
                    } else {
                        const original = weeks[index]
                        weeks[index] = {
                            ...original,
                            punches: [
                                ...original.punches,
                                punch
                            ]
                        }
                    }

                    return weeks;
                }, [])
            })

            return next();
        }
    })

    router({
        label: "Punch in",
        path: BASE_PATH,
        method: "post",
        requireAuth: true,
        handler: async function (req, res, next) {
            const user = req.user

            if (!isValidUser(user) || !isValidUserId(user._id)) {
                return next(badUserBoom())
            }

            // Check if the user has an open punch anywhere
            const openPunches = await Punches.listOpenPunches(user._id);
            const openPunch = openPunches.rows.find(p => p.user_id === user._id);

            if (openPunch) {
                // User has an open punch
                return next(boom.expectationFailed(`User has an open punch: ${openPunch._id}`))
            }

            const newPunch: Punch = {
                start_date: Date.now(),
                end_date: undefined,
                user_id: user._id
            }
            const result = await Punches.post(newPunch);

            res.json<Punch>({ ...newPunch, _id: result.id, _rev: result.rev })

            return next();
        }
    })

    router({
        label: "Punch out",
        path: BASE_PATH + ":id",
        method: "put",
        requireAuth: true,
        paramValidation: gv.object<requests.GetPutDelete>({
            id: gv.string().required().label("URL parameter 'id'")
        }),
        queryValidation: gv.object<requests.PunchOutQuery>({
            rev: gv.string().required().label("Query parameter 'rev'")
        }),
        handler: async function (req, res, next) {
            const user = req.user;
            const params: requests.GetPutDelete = req.validatedParams;
            const query: requests.PunchOutQuery = req.validatedQuery;

            if (!isValidUser(user) || !isValidUserId(user._id)) {
                return next(badUserBoom())
            }

            const punch = await Punches.get(params.id)

            if (punch.user_id !== user._id) {
                return next(boom.unauthorized(`Punch does not belong to user.`))
            }

            const result = await Punches.put(params.id, {
                ...punch,
                end_date: Date.now()
            }, query.rev)

            res.json<Punch>({ ...punch, _rev: result.rev });

            return next();
        }
    })
}