import * as boom from 'boom';
import * as gv from 'gearworks-validation';
import * as Requests from 'requests/auth';
import inspect from 'logspect';
import { compareSync, hashSync } from 'bcryptjs';
import { DavenportError } from 'davenport';
import { decode } from 'jwt-simple';
import { Express } from 'express';
import { RouterFunction } from 'gearworks-route';
import { User } from 'app';
import { Users } from '../database';

const BASE_PATH = "/api/v1/auth/";

const PATH_REGEX = /\/api\/v1\/auth*?/i;

export function registerAuthRoutes(app: Express, route: RouterFunction<User>) {
    const bodyValidation = gv.object<Requests.LoginOrRegister>({
        username: gv.string().min(3).trim().required(),
        password: gv.string().min(5).required(),
    });

    route({
        method: "post",
        path: BASE_PATH,
        requireAuth: false,
        bodyValidation,
        handler: async function (req, res, next) {
            const model: Requests.LoginOrRegister = req.validatedBody;
            let user: User;

            try {
                user = await Users.get(model.username)

                if (!user) {
                    return next(boom.notFound(`A user with that username does not exist.`))
                }
            } catch (_e) {
                const e: DavenportError = _e;

                if (e.status === 404) {
                    return next(boom.notFound(`A user with that username does not exist.`))
                }

                throw e
            }

            if (!compareSync(model.password, user.hashed_password)) {
                return next(boom.unauthorized(`Password is incorrect.`));
            }

            await res.withSessionToken(user)

            return next();
        }
    });

    route({
        label: "Create a user",
        method: "post",
        path: BASE_PATH + "register",
        requireAuth: false,
        bodyValidation,
        handler: async function (req, res, next) {
            const model: Requests.LoginOrRegister = req.validatedBody;
            const exists = await Users.exists(model.username)

            if (exists) {
                return next(boom.badData(`A user with that username already exists.`))
            }

            const hashedPassword = hashSync(model.password)
            const result = await Users.post({ _id: model.username, hashed_password: hashedPassword })
            const user: User = { hashed_password: hashedPassword, _rev: result.rev, _id: result.id }

            await res.withSessionToken(user);

            return next();
        }
    })
}