"use strict";

const { Readable } = require('stream'),
    apiRequest = require('./api-request'),
    MS_TO_S = 1000,
    NOT_FOUND = 404;

function getChatFragment(start, vodID, clientId, testServer) {
    let parameter = `content_offset_seconds=${start}`;
    if(typeof start !== "number") {
        parameter = `cursor=${start}`;
    }
    return apiRequest(`/kraken/videos/${vodID}/comments?${parameter}`, clientId, `Could not load fragment at ${start}`, testServer);
}

function isChatComment(comment) {
    return comment.source === "chat";
}

module.exports = class ChatStream extends Readable {
    constructor({
        start,
        vodID,
        clientId,
        testServer,
        vodStart,
        length
    }) {
        super({ objectMode: true });
        this.offset = 0;
        this.remainingComments = [];
        this.start = start;
        this.vodID = vodID;
        this.clientId = clientId;
        this.testServer = testServer;
        this.vodStart = vodStart;
        this.duration = length;
        this.loadingComments = true;
        this.hadRead = false;
        //TODO [engine:node@>=15] move to _construct
        getChatFragment(start, vodID, clientId, testServer)
            .then((fragment) => {
                this.remainingComments = fragment.comments.filter(isChatComment);
                this.cursor = fragment._next;
                this.loadingComments = false;
                // work-around not having the construct callback in node < 15
                if(this.hadRead) {
                    this._read();
                }
            })
            .catch((error) => {
                if("response" in error && error.response.status === NOT_FOUND) {
                    this.destroy(new Error("This video has no recorded chat"));
                }
                else {
                    this.destroy(error);
                }
            });
    }

    pushComments(comments) {
        let handledComments = 0;
        for(const comment of comments) {
            if(this.push(comment)) {
                ++handledComments;
            }
            else {
                ++handledComments;
                this.remainingComments = comments.slice(handledComments);
                this.lastComment = comment;
                return true;
            }
        }
        return false;
    }
    _read() {
        // Need to ensure we don't crash with pending actions, since _read can be called during HTTP requests and such.
        if(this.loadingComments) {
            this.hadRead = true;
            return;
        }
        this.loadingComments = true;
        if(this.remainingComments.length) {
            if(this.pushComments(this.remainingComments)) {
                this.loadingComments = false;
                return;
            }
            this.lastComment = this.remainingComments.pop();
            this.remainingComments.length = 0;
        }
        let offset = 0;
        if(this.lastComment) {
            offset = Math.floor((Date.parse(this.lastComment.created_at) - this.vodStart) / MS_TO_S);
        }

        if(this.cursor && offset < this.duration) {
            getChatFragment(this.cursor, this.vodID, this.clientId, this.testServer)
                .then((response) => {
                    this.cursor = response._next;
                    if(response.comments.length) {
                        this.remainingComments = response.comments.filter(isChatComment);
                    }
                    this.loadingComments = false;
                    this._read();
                })
                .catch((error) => this.destroy(error));
        }
        else {
            this.push(null);
            this.loadingComments = false;
        }
    }
};
