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

function searchChat(start, length, vodID, c, progress = false) {
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
        return [].concat(...fragments);
    }).catch((e) => {
        bar.terminate();
        throw e;
    });
}

function formatMessage(msg, c) {
    const timestamp = "["+new Date(msg.attributes.timestamp).toTimeString()+"]";
    const username = "<"+msg.attributes.from+">";
    const message = msg.attributes.message;
    if(c) {
        return [timestamp.grey, colorize(username, msg.attributes.color).bold, message].join(" ");
    }
    else {
        return [timestamp, username, message].join(" ");
    }
}

function printResults(results, c) {
    return results.map((msg) => {
        return formatMessage(msg, c);
    }).join("\n");
}

function searchVOD(vodID, colorize, clientId, progress = false) {
    if(vodID.search(/^v[0-9]+$/) == -1) {
        return Promise.reject("Invalid VOD ID specified. The ID must have the format of v123456789.");
    }
    else {
        return getVODMeta(vodID, clientId).then((meta) => {
            return searchChat(meta.start, meta.length, vodID, colorize, progress)
        }).then((results) => {
            return printResults(results, colorize);
        })
    }
}

exports.getChatlog = searchVOD;
