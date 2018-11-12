"use strict";
const fetch = require("node-fetch"),
    chalk = require("chalk"),
    ora = require("ora"),
    termImg = require('term-img'),
    stringReplaceAsync = require('string-replace-async'),
    formatBadge = require('./badges'),
    cheers = require('./cheers'),
    NO_RESULT = -1,
    NOT_FOUND = 404,
    ZERO = 0,
    MS_TO_S = 1000,
    EMOTE_SIZE = '1.0';

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

async function searchChat(start, length, vodID, clientId, progress = false, testServer, vodStart) {
    let fragment,
        bar,
        offset = 0;
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

    let cursor = fragment._next,
        lastComment;
    const comments = fragment.comments.filter((c) => c.source === "chat");
    if(comments.length) {
        lastComment = comments[comments.length + NO_RESULT];
        offset = Math.floor((Date.parse(lastComment.created_at) - vodStart) / MS_TO_S);
    }

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

        if(comments.length) {
            lastComment = comments[comments.length + NO_RESULT];
            offset = Math.floor((Date.parse(lastComment.created_at) - vodStart) / MS_TO_S);
        }
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
    if(time.search(/^\d{2}:\d{2}(?:[:.]\d{2})?$/) != NO_RESULT) {
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
    if(typeof options.vodId != "number" && (typeof options.vodId != "string" || options.vodId.search(/^v?\d+$/) == NO_RESULT)) {
        return Promise.reject(new Error("Invalid VOD ID specified. The ID must have the format of 123456789."));
    }

    const FIRST_CHAR = 0,
        VOD_ID_PREFIX = "v";

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

    return searchChat(Math.floor(diff), Math.min(options.length, meta.length - diff), options.vodId, options.clientId, options.progress, options.testServer, meta.start + options.start);
}
exports.getChatlog = searchVOD;

function formatUsername(msg) {
    const username = msg.commenter.display_name || msg.commenter.name;
    if(msg.message.is_action) {
        return `** ${username}`;
    }
    return `<${username}>`;
}

const emoticonCache = new Map();
async function getEmoticon(emoteId) {
    if(emoticonCache.has(emoteId)) {
        return emoticonCache.get(emoteId);
    }
    const res = await fetch(`https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/${EMOTE_SIZE}`);
    if(res.ok) {
        const buf = await res.buffer();
        emoticonCache.set(emoteId, buf);
        return buf;
    }
}

function getCheerTier(prefix, amount, cheerEmotes) {
    const action = cheerEmotes.find((action) => action.prefix.toLowerCase() == prefix);
    let tier;
    for(const candidate of action.tiers) {
        if(candidate.min_bits <= amount && (!tier || tier.min_bits < candidate.min_bits)) {
            tier = candidate;
        }
    }
    return tier;
}

function getCheerParam(tier, param, defaultVal) {
    if(tier[param].includes(defaultVal)) {
        return defaultVal;
    }
    for(const val of tier[param]) {
        if(val) {
            return val;
        }
    }
}

function getBestCheerParams(tier) {
    return [
        getCheerParam(tier, 'backgrounds', 'dark'),
        getCheerParam(tier, 'states', 'static'),
        getCheerParam(tier, 'scales', '1')
    ];
}

const cheerCache = new Map();
async function getCheerEmote(prefix, tier) {
    if(cheerCache.has(prefix + tier.id)) {
        return cheerCache.get(prefix + tier.id);
    }
    const [
            background,
            state,
            scale
        ] = getBestCheerParams(tier),
        res = await fetch(tier.images[background][state][scale]);
    if(res.ok) {
        const buf = await res.buffer();
        cheerCache.set(prefix + tier.id, buf);
        return buf;
    }
}

async function getCheerEmotes(channelId, clientId, testServer) {
    const res = await fetch(`${getHost("https://api.twitch.tv", testServer)}/kraken/bits/actions?channel_id=${channelId}`, {
        headers: {
            "Client-ID": clientId,
            "Accept": "application/vnd.twitchtv.v5+json"
        }
    });
    if(res.ok) {
        return res.json();
    }
    console.warn("Could not fetch bits for channel", channelId, res.status);
    return [];
}

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
    year: '2-digit',
    month: '2-digit',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
});
async function formatMessage(msg, c = false, loadImages = false, cheerEmotes, clientId, testServer) {
    let badges = "";
    if(msg.message.user_badges && c) {
        badges = msg.message.user_badges.map(formatBadge).join("");
    }
    const timestamp = `[${timestampFormatter.format(new Date(msg.created_at))}]`,
        username = badges + formatUsername(msg),
        { body: message } = msg.message;
    if(c) {
        let colorizedUsername = chalk.bold(username),
            formattedMessage = message;
        if(msg.message.user_color) {
            colorizedUsername = chalk.hex(msg.message.user_color)(colorizedUsername);
        }
        else {
            colorizedUsername = chalk.yellow(colorizedUsername);
        }
        if(msg.message.bits_spent && !cheerEmotes.length && clientId) {
            //TODO this could already happen when the fragments are being loaded.
            const cheerEmoteActions = await getCheerEmotes(msg.channel_id, clientId, testServer);
            for(const action of cheerEmoteActions.actions) {
                cheerEmotes.push(action);
            }
        }
        const cheerEmoteList = cheerEmotes.map((e) => e.prefix.toLowerCase());
        if(msg.message.fragments && msg.message.fragments.length && (loadImages || msg.message.bits_spent)) {
            const frags = await Promise.all(msg.message.fragments.map(async (f) => {
                if(f.emoticon && loadImages) {
                    const emote = await getEmoticon(f.emoticon.emoticon_id);
                    return termImg.string(emote, {
                        fallback: () => f.text
                    });
                }
                else if(msg.message.bits_spent) {
                    return stringReplaceAsync(f.text, /(^|\b)([0-9a-z]+[a-z])(\d+)(\b|$)/g, async (match, prefix, type, amount, postfix) => {
                        if(cheerEmoteList.includes(type)) {
                            const tier = getCheerTier(type, amount, cheerEmotes);
                            if(loadImages) {
                                const emote = await getCheerEmote(type, tier);
                                return prefix + termImg.string(emote, {
                                    fallback: () => cheers.formatCheer(amount, tier.color)
                                }) + chalk.bold.hex(tier.color)(amount) + postfix;
                            }
                            return prefix + cheers.formatCheer(amount, tier.color) + postfix;
                        }
                        return match;
                    });
                }
                return f.text;
            }));
            formattedMessage = frags.join('');
        }
        if(msg.message.is_action) {
            colorizedUsername = chalk.italic(colorizedUsername);
            formattedMessage = chalk.italic(formattedMessage);
            if(msg.message.user_color) {
                formattedMessage = chalk.hex(msg.message.user_color)(formattedMessage);
            }
            else {
                formattedMessage = chalk.yellow(formattedMessage);
            }
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
 * @param {boolean} [progress=false] - If a progress indicator should be shown.
 * @param {boolean} [loadImages=false] - Try to display images.
 * @param {string} [clientId] - Client ID to fetch cheer emote info.
 * @param {string} [testServer] - Test server override to fetch cheer emote info.
 * @returns {string} Formatted results.
 */
async function printResults(results, colorized, progress, loadImages, clientId, testServer) {
    let bar;
    if(progress) {
        bar = ora('Building messages...').start();
    }
    const cheerEmotes = [],
        formattedMessages = await Promise.all(results.map((msg) => formatMessage(msg, colorized, loadImages, cheerEmotes, clientId, testServer)));
    if(bar) {
        bar.succeed('All messages assembled');
    }
    return formattedMessages.join("\n");
}
exports.printResults = printResults;
