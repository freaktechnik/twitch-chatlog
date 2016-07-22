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

function getVODMeta(vodID, clientId) {
    return fetch("https://api.twitch.tv/kraken/videos/"+vodID, {
        headers: {
            "Client-ID": clientId
        }
    }).then((resp) => {
        if(resp.ok)
            return resp.json();
        else
            throw "Could not load VOD details: " + resp.statusText;
    }).then((json) => {
        return {
            start: Math.floor(Date.parse(json.recorded_at)/1000),
            length: json.length
        };
    });
}

function getChatFragment(start, vodID) {
    return fetch("https://rechat.twitch.tv/rechat-messages?start="+start+"&video_id="+vodID)
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
    for(var i = 30; i < length; i += 30) {
        ts.push(start+i);
    }

	var promises = ts.map((timestamp) => {
        return getChatFragment(timestamp, vodID);
    });

    if(progress) {
        var bar = new ProgressBar("[:bar] :percent", {
	        total: ts.length,
	        clear: true,
	        complete: c ? '='.green : '=',
	        incomplete: ' '
        });

        var progressListener = () => bar.tick();
        promises.forEach((p) => p.then(progressListener));
	}

    return Promise.all(promises).then((fragments) => {
        bar.terminate();
        return [].concat(...fragments);
    }).catch((e) => {
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
 */
/**
 * Fetches the chatlog from a Twitch VOD and returns the raw chatlog message objects.
 * @param {Object} options
 * @async
 * @returns {<Array.<Object>}
 * @throws An error is thrown, if the VOD ID is invalid or a network problem occurs.
 */
function searchVOD(options) {
    if(options.vodId.search(/^v[0-9]+$/) == -1) {
        return Promise.reject("Invalid VOD ID specified. The ID must have the format of v123456789.");
    }
    else {
        return getVODMeta(options.vodId, options.clientId).then((meta) => {
            return searchChat(meta.start, meta.length, options.vodId, options.colorize, options.progress)
        });
    }
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
 * @param {Array.<Object>} results
 * @param {boolean} [colorize = false]
 * @returns {string}
 */
function printResults(results, colorize) {
    return results.map((msg) => {
        return formatMessage(msg, colorize);
    }).join("\n");
}
exports.printResults = printResults;
