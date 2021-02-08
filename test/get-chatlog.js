import test from 'ava';
import express from 'express';
import toArray from 'stream-to-array';
import vod from './api/v79240813.json';
import rechatMessage from './api/rechat-message.json';
import { getChatlog } from '../lib';

const createServer = (error) => {
    const server = express();

    error = error || 0;

    if(error != 1) {
        server.get('/kraken/videos/79240813', (request, response) => {
            response.json(vod);
        });
    }
    if(error != 2) {
        server.get('/kraken/videos/79240813/comments', (request, response) => {
            response.json(rechatMessage);
        });
    }

    return new Promise((resolve) => {
        const s = server.listen(0, () => resolve(s));
    });
};

const closeServer = (server) => new Promise((resolve) => server.close(resolve));

const vodId = vod._id.slice(1);

test("Getting message", async (t) => {
    const server = await createServer();
    t.teardown(() => closeServer(server));
    const result = await toArray(await getChatlog({
        vodId,
        start: 0,
        length: 30,
        testServer: server.address()
    }));

    t.is(result.length, rechatMessage.comments.length);
    t.deepEqual(result, rechatMessage.comments);
});

test.todo("Test getting multiple fragments");
test.todo("Test getting chat messages with start and end");
test.todo("Test getting chat messages with length");

test("Getting all fragments to a vod", async (t) => {
    const server = await createServer();
    t.teardown(() => closeServer(server));
    const result = await toArray(await getChatlog({
        vodId,
        testServer: server.address()
    }));

    t.is(result.length, rechatMessage.comments.length);
});

test("Error fetching VOD info", async (t) => {
    const server = await createServer(1);
    t.teardown(() => closeServer(server));
    await t.throwsAsync(getChatlog({
        vodId,
        testServer: server.address()
    }));
});

test("Error fetching log frament", async (t) => {
    const server = await createServer(2);
    t.teardown(() => closeServer(server));
    await t.throwsAsync(toArray(await getChatlog({
        vodId,
        testServer: server.address()
    })));
});
