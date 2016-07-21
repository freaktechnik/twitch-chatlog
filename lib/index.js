const fetch = require("node-fetch");
const colors = require("colors");
const toColors = require("hex-to-color-name");

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

function getVODMeta(vodID) {
    return fetch("https://api.twitch.tv/kraken/videos/"+vodID, {
        headers: {
            "Client-ID": "hdaoisxhhrc9h3lz3k224iao13crkkq8"
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

function searchChat(start, length, vodID) {
    var ts = [ start ];
    for(var i = 30; i < length; i += 30) {
        ts.push(start+i);
    }
    return Promise.all(ts.map((timestamp) => {
        return getChatFragment(timestamp, vodID);
    })).then((fragments) => {
        return [].concat(...fragments);
    });
}

function formatMessage(msg, color) {
    const timestamp = "["+new Date(msg.attributes.timestamp).toTimeString()+"]";
    const username = "<"+msg.attributes.from+">";
    const message = msg.attributes.message;
    if(color) {
        return [timestamp.grey, colorize(username, msg.attributes.color).bold, message].join(" ");
    }
    else {
        return [timestamp, username, message].join(" ");
    }
}

function printResults(results) {
    results.forEach((msg) => {
        console.log(formatMessage(msg));
    });
}

function searchVOD(vodID, colorize) {
    if(vodID.search(/^v[0-9]+$/) == -1) {
        console.error("Invalid VOD ID specified. The ID must have the format of v123456789.");
        process.exit(1);
    }
    else {
        getVODMeta(vodID).then((meta) => {
            return searchChat(meta.start, meta.length, vodID)
        }).then((results) => {
            return printResults(results, colorize);
        }).catch(console.error);
    }
}

exports.getChatlog = searchVOD;
