"use strict";

const fetch = require('node-fetch'),
    { Transform } = require('stream'),
    chalk = require("chalk"),
    termImg = require('term-img'),
    stringReplaceAsync = require('string-replace-async'),
    apiRequest = require('./api-request'),
    formatBadge = require('./badges'),
    cheers = require('./cheers'),
    emoticonCache = new Map(),
    cheerCache = new Map(),
    timestampFormatter = new Intl.DateTimeFormat(undefined, {
        year: '2-digit',
        month: '2-digit',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }),
    EMOTE_SIZE = '1.0';

function formatUsername(message) {
    const username = message.commenter.display_name || message.commenter.name;
    if(message.message.is_action) {
        return `** ${username}`;
    }
    return `<${username}>`;
}

async function getEmoticon(emoteId) {
    if(emoticonCache.has(emoteId)) {
        return emoticonCache.get(emoteId);
    }
    const response = await fetch(`https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/${EMOTE_SIZE}`);
    if(response.ok) {
        const buf = await response.buffer();
        emoticonCache.set(emoteId, buf);
        return buf;
    }
}

function getCheerTier(prefix, amount, cheerEmotes) {
    const action = cheerEmotes.find((emoteAction) => emoteAction.prefix.toLowerCase() == prefix);
    let tier;
    for(const candidate of action.tiers) {
        if(candidate.min_bits <= amount && (!tier || tier.min_bits < candidate.min_bits)) {
            tier = candidate;
        }
    }
    return tier;
}

function getCheerParameter(tier, parameter, defaultValue) {
    if(tier[parameter].includes(defaultValue)) {
        return defaultValue;
    }
    for(const value of tier[parameter]) {
        if(value) {
            return value;
        }
    }
}

function getBestCheerParameters(tier) {
    return [
        getCheerParameter(tier, 'backgrounds', 'dark'),
        getCheerParameter(tier, 'states', 'static'),
        getCheerParameter(tier, 'scales', '1')
    ];
}

async function getCheerEmote(prefix, tier) {
    if(cheerCache.has(prefix + tier.id)) {
        return cheerCache.get(prefix + tier.id);
    }
    const [
            background,
            state,
            scale
        ] = getBestCheerParameters(tier),
        response = await fetch(tier.images[background][state][scale]);
    if(response.ok) {
        const buf = await response.buffer();
        cheerCache.set(prefix + tier.id, buf);
        return buf;
    }
}

async function getCheerEmotes(channelId, clientId, testServer) {
    try {
        const response = await apiRequest(`/kraken/bits/actions?channel_id=${channelId}`, clientId, `Could not fetch bits for channel ${channelId}`, testServer);
        return response;
    }
    catch(error) {
        if("response" in error) {
            console.warn(error.message, error.response.status);
            return [];
        }
        throw error;
    }
}

async function formatMessage(message_, c = false, loadImages = false, cheerEmotes, clientId, testServer) {
    let badges = "";
    if(message_.message.user_badges && c) {
        badges = message_.message.user_badges.map(formatBadge).join("");
    }
    const timestamp = `[${timestampFormatter.format(new Date(message_.created_at))}]`,
        username = badges + formatUsername(message_),
        { body: message } = message_.message;
    if(c) {
        let colorizedUsername = chalk.bold(username),
            formattedMessage = message;
        if(message_.message.user_color) {
            colorizedUsername = chalk.hex(message_.message.user_color)(colorizedUsername);
        }
        else {
            colorizedUsername = chalk.yellow(colorizedUsername);
        }
        if(message_.message.bits_spent && !cheerEmotes.length && clientId) {
            //TODO this could already happen when the fragments are being loaded.
            const cheerEmoteActions = await getCheerEmotes(message_.channel_id, clientId, testServer);
            for(const action of cheerEmoteActions.actions) {
                cheerEmotes.push(action);
            }
        }
        const cheerEmoteList = cheerEmotes.map((emote) => emote.prefix.toLowerCase());
        if(message_.message.fragments && message_.message.fragments.length && (loadImages || message_.message.bits_spent)) {
            const frags = await Promise.all(message_.message.fragments.map(async (f) => {
                if(f.emoticon && loadImages) {
                    const emote = await getEmoticon(f.emoticon.emoticon_id);
                    return termImg.string(emote, {
                        fallback: () => f.text
                    });
                }
                else if(message_.message.bits_spent) {
                    return stringReplaceAsync(f.text, /(^|\b)([\da-z]+[a-z])(\d+)(\b|$)/g, async (match, prefix, type, amount, postfix) => {
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
        if(message_.message.is_action) {
            colorizedUsername = chalk.italic(colorizedUsername);
            formattedMessage = chalk.italic(formattedMessage);
            if(message_.message.user_color) {
                formattedMessage = chalk.hex(message_.message.user_color)(formattedMessage);
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

exports.TextStream = class TextStream extends Transform {
    constructor({
        colorized,
        loadImages,
        clientId,
        testServer
    }) {
        super({ objectMode: true });
        this.colorized = colorized;
        this.loadImages = loadImages;
        this.cheerEmotes = [];
        this.clientId = clientId;
        this.testServer = testServer;
    }

    _transform(message, encoding, callback) {
        formatMessage(message, this.colorized, this.loadImages, this.cheerEmotes, this.clientId, this.testServer)
            .then((formattedMessage) => {
                callback(null, `${formattedMessage}${'\n'}`);
            })
            .catch((error) => {
                callback(error);
            });
    }
};

exports.JSONStream = class JSONStream extends Transform {
    constructor() {
        super({ objectMode: true });
        this.started = false;
    }
    _flush(callback) {
        if(this.started) {
            this.push(']');
        }
        else {
            this.push('[]');
        }
        callback();
    }
    _transform(message, encoding, callback) {
        try {
            const json = JSON.stringify(message);
            let separator = ',';
            if(!this.started) {
                separator = '[';
                this.started = true;
            }
            callback(null, separator + json);
        }
        catch(error) {
            callback(error);
        }
    }
};
