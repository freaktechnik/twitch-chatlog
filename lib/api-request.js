"use strict";

const fetch = require('node-fetch');

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

module.exports = function apiRequest(path, clientId, errorMessage, testServer) {
    return fetch(`${getHost("https://api.twitch.tv", testServer)}${path}`, {
        headers: {
            "Client-ID": clientId,
            "Accept": "application/vnd.twitchtv.v5+json"
        }
    })
        .then((resp) => {
            if(resp.ok) {
                return resp.json();
            }

            throw new RequestError(`${errorMessage}: ${resp.statusText}`, resp);
        });
};
