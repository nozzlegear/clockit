export function getClosestSunday(from = new Date()) {
    // To make the start of the week monday, just add the day's date.getDay() number. So Sunday is 0, Monday is 1, Tuesday is 2, etc.
    const day = from.getDay();
    // Must subtract values to make sure this can handle previous months or years.
    const sunday = new Date(from.getTime() - 60 * 60 * 24 * day * 1000);

    return new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 0, 0, 0);
}

export function getWeekNumber(d: Date | number) {
    if (typeof (d) === "number") {
        d = new Date(d);
    }

    // Copy date so don't modify original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    // Return array of year and week number
    return {
        year: d.getUTCFullYear(),
        week: weekNo
    };
}