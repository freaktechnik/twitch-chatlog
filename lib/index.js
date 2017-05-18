const colors = require("colors"),
    toColors = require("hex-to-color-name"),
    ProgressBar = require("progress"),
    requestpromise = require('request-promise');

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

function getHost(host, testServer) {
    /* istanbul ignore else */
    if(testServer) {
        return "http://localhost:"+testServer.port;
    }
    else {
        return host;
    }
}

function getVODMeta(vodID, clientId, testServer) {
    var options = {
      url: getHost("https://api.twitch.tv", testServer)+"/kraken/videos/"+vodID,
      headers: {
          "Client-ID": clientId,
          "Accept": "application/vnd.twitchtv.v3+json"
      },
      family: 4, // https://github.com/nodejs/node/issues/5436#issuecomment-189600282
    };

    return requestpromise(options).then((resp) => {
      var json = JSON.parse(resp);

      return {
          start: Date.parse(json.recorded_at),
          length: json.length
      };
    });
}

function getChatFragment(start, vodID, testServer) {
  var options = {
    url: getHost("https://rechat.twitch.tv", testServer)+"/rechat-messages?start="+start+"&video_id="+vodID,
    family: 4, // https://github.com/nodejs/node/issues/5436#issuecomment-189600282
  };

  return requestpromise(options).then((resp) => {
      return JSON.parse(resp).data;
  });
}

function searchChat(start, length, vodID, c = false, progress = false, workerCount = 1, testServer) {
    c = c || false;
    progress = progress || false;
    workerCount = workerCount || 1;

    const ts = [ start ];
    // The fragments cover 30 seconds each.
    for(var i = 30; i < length; i += 30) {
        ts.push(start+i);
    }

    workerCount = Math.min(ts.length, workerCount) || ts.length;

    let promises = ts.map((timestamp) => {
        return getChatFragment(timestamp, vodID, testServer);
    });

    let bar = false;
    /* istanbul ignore next */
    if(progress) {
        bar = new ProgressBar("[:bar] :percent", {
            total: ts.length,
            clear: true,
            complete: c ? '='.green : '=',
            incomplete: ' '
       });

        const progressListener = (result) => {
            bar.tick();
            return result;
        };
        promises = promises.map((p) => p.then(progressListener));
	}

    // Parallel promise fetching.
	const workerHandler = (prevResult, result) => {
            let ret = Array.isArray(result) ? result : [ result ];
            if(prevResult) {
                ret = ret.concat(prevResult);
            }
            return ret;
        },
        worker = (prevResult) => {
            const promise = promises.shift();
            if(!promise) {
                return Promise.resolve(prevResult);
            }
            return promise
                .then(worker)
                .then(workerHandler.bind(null, prevResult));
        },
        ch = [];

    for(let i = 0; i < workerCount; ++i) {
        ch[i] = worker();
    }

    return Promise.all(ch).then((fragments) => {
        /* istanbul ignore next */
        if(bar) {
            bar.terminate();
        }

        return [].concat(...fragments)
            .sort((a, b) => a.attributes.timestamp - b.attributes.timestamp);
    }).catch((e) => {
        /* istanbul ignore next */
        if(bar) {
            bar.terminate();
        }

        if(promises.length) {
            // vacuum unhandled rejections
            promises.unshift(Promise.reject(e));
            return Promise.all(promises);
        }

        throw e;
    });
}

function parseTime(time, name) {
    if(time.search(/^\d{2}:\d{2}((:|\.)\d{2})?$/) != -1) {
        time = "1970-01-01T"+time+"+00:00";
    }
    const timestamp = Date.parse(time);

    if(isNaN(timestamp) || timestamp < 0) {
        throw `Could not read the ${name} time`;
    }
    return timestamp;
}

/**
 * @typedef {Object} SearchVODOptions
 * @property {string|number} vodId - The ID of the VOD, without the "v" at the start.
 * @property {string} [clientId] - Twitch client ID.
 * @proeprty {boolean} [colorize=false] - If the progress bar should be
 *                                        colorized.
 * @property {boolean} [progress=false] - Show a progress bar.
 * @property {string} [start="0"] - The start time to fetch the chat log from.
 * @property {number} [length] - The length of the log to fetch in seconds. If
 *                               omitted or 0 fetches the whole log.
 * @property {string} [end] - The end time to fetch the log up until. Overrides
 *                            length.
 * @property {number} [requests] - Amount of requests to send at once.
 */
/**
 * Fetches the chatlog from a Twitch VOD and returns the raw chatlog message
 * objects.
 *
 * @param {Object} options
 * @async
 * @returns {<Array.<Object>}
 * @throws An error is thrown, if the VOD ID is invalid or a network problem
 *         occurs.
 */
function searchVOD(options) {
    if(typeof options.vodId != "number" && (typeof options.vodId != "string" || options.vodId.search(/^v?[0-9]+$/) == -1)) {
        return Promise.reject("Invalid VOD ID specified. The ID must have the format of 123456789.");
    }

    if(options.vodId[0] == "v") {
        options.vodId = options.vodId.substr(1);
        console.warn("A v in front of the VOD ID is deprecated. You can just leave it out.");
    }

    if(options.start) {
        try {
            options.start = parseTime(options.start, "start");
        }
        catch(e) {
            return Promise.reject(e);
        }
    }
    else {
        // start from the beginning by default.
        options.start = 0;
    }
    if(options.end) {
        try {
            options.end = parseTime(options.end, "end");
        }
        catch(e) {
            return Promise.reject(e);
        }
    }

    if(options.length == 0 || !options.length) {
        options.length = Number.MAX_SAFE_INTEGER;
    }

    return getVODMeta(options.vodId, options.clientId, options.testServer).then((meta) => {
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

        return searchChat(Math.floor(start / 1000), Math.min(options.length, meta.length - diff), options.vodId, options.colorize, options.progress, options.requests, options.testServer);
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
