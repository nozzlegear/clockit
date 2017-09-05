import * as qs from 'qs';
import * as Stores from '../stores';

/**
 * Notifies the user that their account has been logged out, and that they must log in again before their request can be made. Returns true if they accept the prompt to log in again, false if not.
 */
export function handleUnauthorized(redirectBackTo?: string, querystring?: Object) {
    if (confirm("Your account has been logged out, and you must log in again before your request can be made. Do you want to log in again?")) {
        window.location.search = qs.stringify({ redirect: redirectBackTo, qs: querystring });

        Stores.Auth.logout();

        return true;
    }

    return false;
}

export default handleUnauthorized