import {fetchJSON} from './fetch'

let cache = {};
let serverDate;
let dateCallbacks = [];

let fns = {
    prefetch: (url, saveDate) => {
        // save response in cache for a later `get` call
        if (!cache[url]) { // if not already fetching/fetched
            let promise = fetchJSON(url);
            if (saveDate) {
                promise.then(response => {
                    try {
                        serverDate = new Date(promise.request.getResponseHeader('Date'));
                        dateCallbacks.forEach(cb => cb(serverDate));
                        dateCallbacks = [];
                    } catch (err) { console.log(err); }
                    return response;
                })
            }
            promise
                .then(json => cache[url] = json)
                .fail(() => { delete cache[url]; });
            return cache[url] = promise
        }
    },
    get: (url, fn, saveDate) => {
        // get response from cache or request if it isn't in cache
        if (!cache[url]) { // fetch if needed
            fns.prefetch(url, saveDate).then(fn);
        } else if (cache[url].then) {
            cache[url].then(fn);
        }
        else if (typeof cache[url] === 'object') {
            fn(cache[url]);
        }
    },
    getServerDate: (cb) => {
        // returns the server time of the last successful request using
        // `get` that was made with saveDate argument set to true
        // used for consistent relative timestamp rendering (can't trust client time)
        if (serverDate) cb(serverDate);
        else dateCallbacks.push(cb);
    }
}

export default fns;
