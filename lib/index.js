"use strict";
const fetch = require("node-fetch"),
    chalk = require("chalk"),
    ora = require("ora"),
    NO_RESULT = -1,
    NOT_FOUND = 404,
    FRAGMENT_LENGTH = 40,
    ZERO = 0;

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
    })
        .then((resp) => {
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

function getChatFragment(start, vodID, clientId, testServer) {
    let param = `content_offset_seconds=${start}`;
    if(typeof start !== "number") {
        param = `cursor=${start}`;
    }
    return fetch(`${getHost("https://api.twitch.tv", testServer)}/kraken/videos/${vodID}/comments?${param}`, {
        headers: {
            "Client-ID": clientId,
            "Accept": "application/vnd.twitchtv.v5+json"
        }
    })
        .then((resp) => {
            if(resp.ok) {
                return resp.json();
            }

            throw new RequestError(`Could not load fragment at ${start}: ${resp.statusText}`, resp);
        });
}

async function searchChat(start, length, vodID, clientId, progress = false, testServer) {
    let fragment,
        bar,
        offset = FRAGMENT_LENGTH;
    /* istanbul ignore next */
    if(progress) {
        bar = ora('Loading chat messages').start();
    }

    try {
        fragment = await getChatFragment(start, vodID, clientId, testServer);
    }
    catch(e) {
        if(progress) {
            bar.fail(e.messsage);
        }
        if("response" in e && e.response.status === NOT_FOUND) {
            throw new Error("This video has no recorded chat");
        }
        throw e;
    }

    let cursor = fragment._next;
    const comments = fragment.comments.filter((c) => c.source === "chat");

    while(cursor && offset < length) {
        const response = await getChatFragment(cursor, vodID, clientId, testServer);
        if(response.comments.length) {
            for(const comment of response.comments) {
                if(comment.source === "chat") {
                    comments.push(comment);
                }
            }
        }
        cursor = response._next;
        // I'm not entirely sure a fragment has a fixed length and isn't just limited to 60 messages.
        offset += FRAGMENT_LENGTH;
        if(progress) {
            bar.text = `Loaded ${offset} seconds of chat messages`;
        }
    }

    /* istanbul ignore next */
    if(bar) {
        bar.succeed('Chat messages loaded');
    }

    return comments;
}

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
 * @returns {[Object]} Chat log.
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
            options.length = Math.floor((options.end - start) / MS_TO_S);
        }
        else {
            options.length = Math.floor((options.end - meta.start - start) / MS_TO_S);
        }
    }

    return searchChat(Math.floor(diff), Math.min(options.length, meta.length - diff), options.vodId, options.clientId, options.progress, options.testServer);
}
exports.getChatlog = searchVOD;

function formatBadge(badgeInfo) {
    switch(badgeInfo._id) {
    case "premium": return chalk.hex('#FFFFFF').bgHex('#009CDC')("👑 ");
    case "turbo": return chalk.hex('#FFFFFF').bgHex('#6441A5')("🔋 ");
    case "moderator": return chalk.hex('#FFFFFF').bgHex('#34AE0A')("⚔️ ");
    case "admin": return chalk.hex('#FFFFFF').bgHex('#FAAF19')("🛡 ");
    case "staff": return chalk.hex('#FFFFFF').bgHex('#200F33')("🔧 ");
    case "globalmod": return chalk.hex('#FFFFFF').bgHex('#006F20')("🗡 "); //TODO not sure on the id and should be an axe...
    case "broadcaster": return chalk.hex('#FFFFFF').bgHex('#E71818')("🎥 ");
    case "subscriber": return chalk.hex('#2D2D2D').bgHex('#E1E1E1')("★ ");
    default: return "";
    }
}

function formatUsername(msg) {
    const username = msg.commenter.display_name || msg.commenter.name;
    if(msg.message.is_action) {
        return `** ${username}`;
    }
    return `<${username}>`;
}

function formatMessage(msg, c = false) {
    let badges = "";
    if(msg.message.user_badges && c) {
        badges = msg.message.user_badges.map(formatBadge).join("");
    }
    const timestamp = `[${new Date(msg.created_at).toTimeString()}]`,
        username = badges + formatUsername(msg),
        { body: message } = msg.message;
    if(c) {
        let colorizedUsername = chalk.bold(username);
        if(msg.message.user_color) {
            colorizedUsername = chalk.hex(msg.message.user_color)(colorizedUsername);
        }
        else {
            colorizedUsername = chalk.yellow(colorizedUsername);
        }
        let formattedMessage = message;
        if(msg.message.is_action) {
            colorizedUsername = chalk.italic(colorizedUsername);
            formattedMessage = chalk.italic(formattedMessage);
        }
        return [
            chalk.gray(timestamp),
            colorizedUsername,
            formattedMessage
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
 * @param {[Object]} results - Results to print.
 * @param {boolean} [colorized=false] - Whether the output should be colorized.
 * @returns {string} Formatted results.
 */
function printResults(results, colorized) {
    return results.map((msg) => formatMessage(msg, colorized)).join("\n");
}
exports.printResults = printResults;
