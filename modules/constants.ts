import inspect from 'logspect';
import isBrowser from 'is-in-browser';
import { resolve } from 'path';

// NODE_ENV and _VERSION are injected by webpack for the browser client.
declare const _VERSION: string;

const env = process && process.env || {};

export const IS_WEBPACK = process && process.mainModule && /webpack.js$/.test(process.mainModule.filename) && process.argv.find(arg => /webpack/.test(arg))

export const APP_NAME = "Clockit";

export const SNAKED_APP_NAME = "clockit";

function get(baseKey: string, defaultValue: string | undefined = undefined) {
    const snakedAppName = SNAKED_APP_NAME.toUpperCase();
    const key = baseKey.toUpperCase();

    return env[`${snakedAppName}_${key}`] || env[`GEARWORKS_${key}`] || env[key] || defaultValue;
}

export const AUTH_HEADER_NAME = "x-clockit-token";

export const CACHE_SEGMENT_AUTH = "auth-invalidation";

export const CURRENT_PUNCH_NAME = SNAKED_APP_NAME + "_current_punch";

// process.env is available during webpack and server, and is injected in the browser by webpack too. This will work anywhere.
export const ISLIVE = env.NODE_ENV === "production";

// However, _VERSION has not yet been injected, so we must first check if we're in webpack before attempting to use _VERSION
export const VERSION = IS_WEBPACK ? "" : _VERSION;

export const COUCHDB_URL = get("COUCHDB_URL", "http://localhost:5984");

export const JWT_SECRET_KEY = get("JWT_SECRET_KEY");

export const IRON_PASSWORD = get("IRON_PASSWORD");

/**
 * The name of the localstorage item that stores the last known page the user was on for the universal order customizer.
 */
export const LAST_PUNCH_NAME = SNAKED_APP_NAME + "_last_punch";

/**
 * The name of the localstorage item that stores the user's JWT auth token and data.
 */
export const AUTH_STORAGE_NAME = SNAKED_APP_NAME + "_JWT";

/**
 * A list of properties on a user or sessiontoken object that will be automatically sealed and unsealed by Iron.
 */
export const SEALABLE_USER_PROPERTIES = [];

if (!isBrowser && !IS_WEBPACK) {
    if (!JWT_SECRET_KEY) {
        inspect("Warning: JWT_SECRET_KEY was not found in environment variables. Session authorization will be unsecure and may exhibit unwanted behavior.");
    }

    if (!IRON_PASSWORD) {
        inspect("Warning: IRON_PASSWORD was not found in environment variables. Session authorization will be unsecure and may exhibit unwanted behavior.");
    }
}