const fetch = require("node-fetch");
const colors = require("colors");
const toColors = require("hex-to-color-name");
const ProgressBar = require("progress");

function colorize(string, hexColor) {
    return string[toColors(hexColor||"#FFFF00", {
        "white": "FFFFFF",
        "black": "000000",
        "red": "FF0000",
        "green": "00FF00",
        "blue": "0000FF",
        "yellow": "FFFF00",
        "gray": "0F0F0F",
        "magenta": "FF00FF",
        "cyan": "00FFFF"
    })];
}

function getHost(host) {
    /* istanbul ignore else */
    if(process.env.TEST)
        return "http://localhost:3001";
    else
        return host;
}

function getVODMeta(vodID, clientId) {
    return fetch(getHost("https://api.twitch.tv")+"/kraken/videos/"+vodID, {
        headers: {
            "Client-ID": clientId,
            "Accept": "application/vnd.twitchtv.v3+json"
        }
    }).then((resp) => {
        if(resp.ok)
            return resp.json();
        else
            throw "Could not load VOD details: " + resp.statusText;
    }).then((json) => {
        return {
            start: Date.parse(json.recorded_at),
            length: json.length
        };
    });
}

function getChatFragment(start, vodID) {
    return fetch(getHost("https://rechat.twitch.tv")+"/rechat-messages?start="+start+"&video_id="+vodID)
    .then((resp) => {
        if(resp.ok)
            return resp.json();
        else
            throw "Could not load fragment at "+start+": "+resp.statusText;
    }).then((json) => {
        return json.data;
    });
}

function searchChat(start, length, vodID, c = false, progress = false) {
    c = c || false;
    progress = progress || false;

    var ts = [ start ];
    // The fragments cover 30 seconds each.
    for(var i = 30; i < length; i += 30) {
        ts.push(start+i);
    }

	var promises = ts.map((timestamp) => {
        return getChatFragment(timestamp, vodID);
    });

    var bar = false;
    /* istanbul ignore next */
    if(progress) {
        bar = new ProgressBar("[:bar] :percent", {
	        total: ts.length,
	        clear: true,
	        complete: c ? '='.green : '=',
	        incomplete: ' '
        });

        var progressListener = () => bar.tick();
        promises.forEach((p) => p.then(progressListener));
	}

    return Promise.all(promises).then((fragments) => {
        /* istanbul ignore next */
        if(bar)
            bar.terminate();
        return [].concat(...fragments);
    }).catch((e) => {
        /* istanbul ignore next */
        if(bar)
            bar.terminate();
        throw e;
    });
}

/**
 * @typedef {Object} SearchVODOptions
 * @property {string} vodId - The ID of the VOD, including the "v" at the start.
 * @property {string} [clientId] - Twitch client ID.
 * @proeprty {boolean} [colorize = false] - If the progress bar should be colorized.
 * @property {boolean} [progress = false] - Show a progress bar.
 * @property {string} [start = "0"] - The start time to fetch the chat log from.
 * @property {number} [length] - The length of the log to fetch in seconds. If omitted or 0 fetches the whole log.
 * @property {string} [end] - The end time to fetch the log up until. Overrides length.
 */
/**
 * Fetches the chatlog from a Twitch VOD and returns the raw chatlog message objects.
 *
 * @param {Object} options
 * @async
 * @returns {<Array.<Object>}
 * @throws An error is thrown, if the VOD ID is invalid or a network problem occurs.
 */
function searchVOD(options) {
    if(typeof options.vodId != "string" || options.vodId.search(/^v[0-9]+$/) == -1) {
        return Promise.reject("Invalid VOD ID specified. The ID must have the format of v123456789.");
    }

    if(options.start) {
        if(options.start.search(/^\d{2}:\d{2}((:|\.)\d{2})?$/) != -1) {
            options.start = "1970-01-01T"+options.start+"+00:00";
        }
        options.start = Date.parse(options.start);

        if(isNaN(options.start)) {
            return Promise.reject("Could not read the start time");
        }
    }
    else {
        // start from the beginning by default.
        options.start = 0;
    }
    if(options.end) {
        if(options.end.search(/^\d{2}:\d{2}((:|\.)\d{2})?$/) != -1) {
            options.end = "1970-01-01T"+options.end+"+00:00";
        }
        options.end = Date.parse(options.end);
        if(isNaN(options.end)) {
            return Promise.reject("Could not read the end time");
        }
    }

    if(options.length == 0 || !options.length) {
        options.length = Number.MAX_SAFE_INTEGER;
    }

    return getVODMeta(options.vodId, options.clientId).then((meta) => {
        var diff, start;
        if(meta.start > options.start) {
            start = meta.start + options.start;
            diff = options.start / 1000;
        }
        else {
            start = options.start;
            diff = (options.start - meta.start) / 1000;
        }
        // Calculate the length if an end time was given.
        if(options.end) {
            if(options.end < start)
                options.length = Math.floor((meta.start + options.end - start) / 1000);
            else
                options.length = Math.floor((options.end - start) / 1000);
        }

        return searchChat(Math.floor(start / 1000), Math.min(options.length, meta.length - diff), options.vodId, options.colorize, options.progress)
    });
}
exports.getChatlog = searchVOD;

function formatMessage(msg, c) {
    c = c  || false;

    const timestamp = "["+new Date(msg.attributes.timestamp).toTimeString()+"]";
    const username = "<"+( msg.attributes.tags['display-name'] || msg.attributes.from )+">";
    const message = msg.attributes.message;
    if(c) {
        return [timestamp.grey, colorize(username, msg.attributes.color).bold, message].join(" ");
    }
    else {
        return [timestamp, username, message].join(" ");
    }
}

/**
 * Creates a string from an array of raw Twitch rechat messageges. The format is
 * [timestamp] <username> message.
 *
 * @param {Array.<Object>} results
 * @param {boolean} [colorize=false]
 * @returns {string}
 */
function printResults(results, colorize) {
    return results.map((msg) => {
        return formatMessage(msg, colorize);
    }).join("\n");
}
exports.printResults = printResults;
