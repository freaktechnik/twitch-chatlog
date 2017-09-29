"use strict";
const fetch = require("node-fetch"),
    chalk = require("chalk"),
    toColors = require("hex-to-color-name"),
    ProgressBar = require("progress"),
    NO_RESULT = -1,
    NOT_FOUND = 404,
    DEFAULT_WORKERS = 1,
    FRAGMENT_LENGTH = 30;

function colorize(string, hexColor) {
    return chalk[toColors(hexColor || "#FFFF00", {
        "white": "FFFFFF",
        "black": "000000",
        "red": "FF0000",
        "green": "00FF00",
        "blue": "0000FF",
        "yellow": "FFFF00",
        "gray": "0F0F0F",
        "magenta": "FF00FF",
        "cyan": "00FFFF"
    })](string);
}

function getHost(host, testServer) {
    /* istanbul ignore else */
    if(testServer) {
        return `http://localhost:${testServer.port}`;
    }

    return host;
}

class RequestError extends Error {
    constructor(message, response) {
        super();
        this.name = "RequestError";
        this.response = response;
        this.message = message;
    }
}

function getVODMeta(vodID, clientId, testServer) {
    return fetch(`${getHost("https://api.twitch.tv", testServer)}/kraken/videos/${vodID}`, {
        headers: {
            "Client-ID": clientId,
            "Accept": "application/vnd.twitchtv.v5+json"
        }
    }).then((resp) => {
        if(resp.ok) {
            return resp.json();
        }

        throw new RequestError(`Could not load VOD details: ${resp.statusText}`, resp);
    })
        .then((json) => ({
            start: Date.parse(json.recorded_at),
            length: json.length
        }));
}

function getChatFragment(start, vodID, testServer) {
    return fetch(`${getHost("https://rechat.twitch.tv", testServer)}/rechat-messages?start=${start}&video_id=v${vodID}`)
        .then((resp) => {
            if(resp.ok) {
                return resp.json();
            }

            throw new RequestError(`Could not load fragment at ${start}: ${resp.statusText}`, resp);
        })
        .then((json) => json.data);
}

async function searchChat(start, length, vodID, c = false, progress = false, workerCount = DEFAULT_WORKERS, testServer) {
    let fragment, fragments;
    try {
        fragment = await getChatFragment(start, vodID, testServer);
    }
    catch(e) {
        if(e.response.status === NOT_FOUND) {
            throw new Error("This video has no recorded chat");
        }
        throw e;
    }

    const ts = [];
    // The fragments cover 30 seconds each.
    for(let i = FRAGMENT_LENGTH; i < length; i += FRAGMENT_LENGTH) {
        ts.push(start + i);
    }

    workerCount = Math.min(ts.length, workerCount) || ts.length;

    let promises = ts.map((timestamp) => getChatFragment(timestamp, vodID, testServer)),
        bar = false;
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
                .then((newResult) => workerHandler(prevResult, newResult));
        },
        ch = [];

    for(let i = 0; i < workerCount; ++i) {
        ch[i] = worker();
    }

    try {
        fragments = await Promise.all(ch);
    }
    catch(e) {
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
    }
    /* istanbul ignore next */
    if(bar) {
        bar.terminate();
    }

    return [].concat(fragment, ...fragments)
        .sort((a, b) => a.attributes.timestamp - b.attributes.timestamp);
}

const ZERO = 0;

function parseTime(time, name) {
    if(time.search(/^\d{2}:\d{2}((:|\.)\d{2})?$/) != NO_RESULT) {
        time = `1970-01-01T${time}+00:00`;
    }
    const timestamp = Date.parse(time);

    if(isNaN(timestamp) || timestamp < ZERO) {
        throw new Error(`Could not read the ${name} time`);
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
 * @param {SearchVODOptions} options - What kind of VOD should be found.
 * @returns {<Array.<Object>} Chat log.
 * @throws An error is thrown, if the VOD ID is invalid or a network problem
 *         occurs.
 */
async function searchVOD(options) {
    if(typeof options.vodId != "number" && (typeof options.vodId != "string" || options.vodId.search(/^v?[0-9]+$/) == NO_RESULT)) {
        return Promise.reject(new Error("Invalid VOD ID specified. The ID must have the format of 123456789."));
    }

    const FIRST_CHAR = 0,
        VOD_ID_PREFIX = "v",
        MS_TO_S = 1000;

    if(options.vodId[FIRST_CHAR] == VOD_ID_PREFIX) {
        options.vodId = options.vodId.substr(VOD_ID_PREFIX.length);
        console.warn("A v in front of the VOD ID is deprecated. You can just leave it out.");
    }

    if(options.start) {
        options.start = parseTime(options.start, "start");
    }
    else {
        // start from the beginning by default.
        options.start = FIRST_CHAR;
    }
    if(options.end) {
        options.end = parseTime(options.end, "end");
    }

    if(!options.length) {
        options.length = Number.MAX_SAFE_INTEGER;
    }

    const meta = await getVODMeta(options.vodId, options.clientId, options.testServer);
    let diff, start;
    if(meta.start > options.start) {
        start = meta.start + options.start;
        diff = options.start / MS_TO_S;
    }
    else {
        start = options.start;
        diff = (options.start - meta.start) / MS_TO_S;
    }
    // Calculate the length if an end time was given.
    if(options.end) {
        if(options.end < start) {
            options.length = Math.floor((meta.start + options.end - start) / MS_TO_S);
        }
        else {
            options.length = Math.floor((options.end - start) / MS_TO_S);
        }
    }

    return searchChat(Math.floor(start / MS_TO_S), Math.min(options.length, meta.length - diff), options.vodId, options.colorize, options.progress, options.requests, options.testServer);
}
exports.getChatlog = searchVOD;

function formatMessage(msg, c) {
    c = c || false;

    const timestamp = `[${new Date(msg.attributes.timestamp).toTimeString()}]`,
        username = `<${msg.attributes.tags['display-name'] || msg.attributes.from}>`,
        message = msg.attributes.message;
    if(c) {
        return [
            chalk.gray(timestamp),
            chalk.bold(colorize(username, msg.attributes.color)),
            message
        ].join(" ");
    }

    return [
        timestamp,
        username,
        message
    ].join(" ");
}

/**
 * Creates a string from an array of raw Twitch rechat messageges. The format is
 * [timestamp] <username> message.
 *
 * @param {Array.<Object>} results - Results to print.
 * @param {boolean} [colorize=false] - Whether the output should be colorized.
 * @returns {string} Formatted results.
 */
function printResults(results, colorize) {
    return results.map((msg) => formatMessage(msg, colorize)).join("\n");
}
exports.printResults = printResults;
