// adapted from https://github.com/philbooth/vagueTime.js

var times = {
    year: 31557600000, // 1000 ms * 60 s * 60 m * 24 h * 365.25 d
    month: 2629800000, // 31557600000 ms / 12 m
    week: 604800000, // 1000 ms * 60 s * 60 m * 24 h * 7 d
    day: 86400000, // 1000 ms * 60 s * 60 m * 24 h
    hour: 3600000, // 1000 ms * 60 s * 60 m
    minute: 60000 // 1000 ms * 60 s
},

languages = {
    en: {
        year: [ 'year', 'years' ],
        month: [ 'month', 'months' ],
        week: [ 'week', 'weeks' ],
        day: [ 'day', 'days' ],
        hour: [ 'hour', 'hours' ],
        minute: [ 'minute', 'minutes' ],

        past: function (vagueTime, unit) {
            return vagueTime + ' ' + unit + ' ago';
        },

        future: function (vagueTime, unit) {
            return 'in ' + vagueTime + ' ' + unit;
        },

        defaults: {
            past: 'just now',
            future: 'soon'
        }
    }
},

defaultLanguage = 'en';

function normaliseUnits (units) {
    if (typeof units === 'undefined') {
        return 'ms';
    }

    if (units === 's' || units === 'ms') {
        return units;
    }

    throw new Error('Invalid units');
}

function normaliseTime(time, units, defaultTime) {
    if (typeof time === 'undefined') {
        return defaultTime;
    }

    if (typeof time === 'string') {
        time = parseInt(time, 10);
    }

    if (isNotDate(time) && isNotTimestamp(time)) {
        throw new Error('Invalid time');
    }

    if (typeof time === 'number' && units === 's') {
        time *= 1000;
    }

    return time;
}

function isNotDate (date) {
    return Object.prototype.toString.call(date) !== '[object Date]' || isNaN(date.getTime());
}

function isNotTimestamp (timestamp) {
    return typeof timestamp !== 'number' || isNaN(timestamp);
}

function estimate (difference, type, language) {
    var time, vagueTime, lang = languages[language] || languages[defaultLanguage];

    for (time in times) {
        if (times.hasOwnProperty(time) && difference >= times[time]) {
            vagueTime = Math.floor(difference / times[time]);
            return lang[type](vagueTime, lang[time][(vagueTime > 1)+0]);
        }
    }

    return lang.defaults[type];
}

export function getVagueTime(options) {
    var units = normaliseUnits(options.units),
        now = Date.now(),
        from = normaliseTime(options.from, units, now),
        to = normaliseTime(options.to, units, now),
        difference = from - to,
        type;

    if (difference >= 0) {
        type = 'past';
    } else {
        type = 'future';
        difference = -difference;
    }

    return estimate(difference, type, options.lang);
}

let processQueue = [];
var now;

function _processEl(options) {
    if (!options.el && options.nodeName) {
        // element was passed as only argument
        options = {el:options};
    }
    let date = new Date(options.el.getAttribute('datetime'))
    options.el.innerHTML = getVagueTime({from: now, to: date});
}

function processEl(options) {
    if (now) {
        _processEl(options);
    } else {
        processQueue.push(options);
    }
}

function setNow(date) {
    now = date;
    if (processQueue.length) {
        processQueue.forEach(_processEl);
        processQueue = [];
    }
}

var fns = {
    setNow: setNow,
    processEl: processEl
};

export default fns;