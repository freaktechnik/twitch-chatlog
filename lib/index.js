"use strict";
const apiRequest = require('./api-request'),
    ChatStream = require('./chat-stream'),
    NO_RESULT = -1,
    ZERO = 0,
    MS_TO_S = 1000;

function getVODMeta(vodID, clientId, testServer) {
    return apiRequest(`/kraken/videos/${vodID}`, clientId, 'Could not load VOD details', testServer)
        .then((json) => ({
            start: Date.parse(json.recorded_at),
            length: json.length
        }));
}

function parseTime(time, name) {
    if(time.search(/^\d{2}:\d{2}(?:[.:]\d{2})?$/) != NO_RESULT) {
        time = `1970-01-01T${time}+00:00`;
    }
    const timestamp = Date.parse(time);

    if(isNaN(timestamp) || timestamp < ZERO) {
        throw new Error(`Could not read the ${name} time`);
    }
    return timestamp;
}

/**
 * @typedef {object} SearchVODOptions
 * @property {string|number} vodId - The ID of the VOD, without the "v" at the start.
 * @property {string} [clientId] - Twitch client ID.
 * @property {boolean} [progress=false] - Show a progress bar.
 * @property {string} [start="0"] - The start time to fetch the chat log from.
 * @property {number} [length] - The length of the log to fetch in seconds. If
 *                               omitted or 0 fetches the whole log.
 * @property {string} [end] - The end time to fetch the log up until. Overrides
 *                            length.
 */
/**
 * Fetches the chatlog from a Twitch VOD and returns the raw chatlog message
 * objects.
 *
 * @param {SearchVODOptions} options - What kind of VOD should be found.
 * @returns {[object]} Chat log.
 * @throws An error is thrown, if the VOD ID is invalid or a network problem
 *         occurs.
 */
async function searchVOD(options) {
    if(typeof options.vodId != "number" && (typeof options.vodId != "string" || options.vodId.search(/^\d+$/) == NO_RESULT)) {
        return Promise.reject(new Error("Invalid VOD ID specified. The ID must have the format of 123456789."));
    }

    const FIRST_CHAR = 0;

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
    let start;
    if(meta.start > options.start) {
        start = options.start;
    }
    else {
        start = options.start - meta.start;
    }
    const diff = start / MS_TO_S;
    // Calculate the length if an end time was given.
    if(options.end) {
        if(options.end < meta.start) {
            options.length = Math.floor((options.end - start) / MS_TO_S); // eslint-disable-line require-atomic-updates
        }
        else {
            options.length = Math.floor((options.end - meta.start - start) / MS_TO_S); // eslint-disable-line require-atomic-updates
        }
    }

    return new ChatStream({
        start: Math.floor(diff),
        length: Math.min(options.length, meta.length - diff),
        vodID: options.vodId,
        clientId: options.clientId,
        testServer: options.testServer,
        vodStart: meta.start + options.start
    });
}
exports.getChatlog = searchVOD;
