import test from 'ava';
import express from 'express';
import vod from './api/v79240813.json';
import rechatMessage from './api/rechat-message.json';
import { getChatlog } from '../lib';

const createServer = (error) => {
    const server = express();

    error = error || 0;

    if(error != 1) {
        server.get('/kraken/videos/79240813', (req, res) => {
            res.json(vod);
        });
    }
    if(error != 2) {
        server.get('/rechat-messages', (req, res) => {
            res.json(rechatMessage);
        });
    }

    return new Promise((resolve) => {
        const s = server.listen(0, () => resolve(s));
    });
};

const closeServer = (server) => {
    return new Promise((resolve) => server.close(resolve));
};

test.todo("Messages are returned in descending time order with one worker");
test.todo("Messages are increasing in time with multiple workers");

test("Getting message", async function(t) {
    const server = await createServer();
    const result = await getChatlog({
        vodId: vod._id,
        start: 0,
        length: 30,
        testServer: server.address()
    });

    t.is(result.length, 1);
    t.deepEqual(result, rechatMessage.data);

    await closeServer(server);
});

test("Getting multiple fragments using length", async function(t) {
    const server = await createServer();
    const result = await getChatlog({
        vodId: vod._id,
        start: 0,
        length: 60,
        testServer: server.address()
    });

    t.is(result.length, 2);

    await closeServer(server);
});

test("Getting multiple fragments with more workers", async function(t) {
    const server = await createServer();
    const result = await getChatlog({
        vodId: vod._id.substr(1),
        start: 0,
        length: 60,
        testServer: server.address(),
        requests: 3
    });

    t.is(result.length, 2);

    await closeServer(server);
});

test("Getting multiple fragments with less workers", async function(t) {
    const server = await createServer();
    const result = await getChatlog({
        vodId: vod._id.substr(1),
        start: 0,
        length: 160,
        testServer: server.address(),
        requests: 2
    });

    t.is(result.length, 6);

    await closeServer(server);
});

test("Getting a partial fragment returns the whole fragment", async function(t) {
    const server = await createServer();
    const result = await getChatlog({
        vodId: vod._id.substr(1),
        start: 0,
        length: 45,
        testServer: server.address()
    });

    t.is(result.length, 2);

    await closeServer(server);
});

test("Getting a partial log based on relative end", async function(t) {
    const server = await createServer();
    const result = await getChatlog({
        vodId: vod._id.substr(1),
        end: "00:03:00",
        testServer: server.address()
    });

    t.is(result.length, 6);

    await closeServer(server);
});

test("Getting a partial log based on relative start and end", async function(t) {
    const server = await createServer();
    const result = await getChatlog({
        vodId: vod._id.substr(1),
        start: "00:01:00",
        end: "00:03:00",
        testServer: server.address()
    });

    t.is(result.length, 4);

    await closeServer(server);
});

test("Getting a partial log based on absolute start and relative end", async function(t) {
    const server = await createServer();
    const result = await getChatlog({
        vodId: vod._id.substr(1),
        start: new Date(Date.parse(vod.recorded_at) + 60000).toString(),
        end: "00:03:20",
        testServer: server.address()
    });

    t.is(result.length, 5);

    await closeServer(server);
});

test("Getting a partial log based on absolute end", async function(t) {
    const server = await createServer();
    const result = await getChatlog({
        vodId: vod._id.substr(1),
        end: new Date(Date.parse(vod.recorded_at) + 60000).toString(),
        testServer: server.address()
    });

    t.is(result.length, 2);

    await closeServer(server);
});

test("Getting all fragments to a vod", async function(t) {
    const server = await createServer();
    const result = await getChatlog({
        vodId: vod._id.substr(1),
        testServer: server.address()
    });

    t.is(result.length, Math.ceil(vod.length / 30));

    await closeServer(server);
});

test("Error fetching VOD info", async (t) => {
    const server = await createServer(1);
    await t.throws(getChatlog({
        vodId: vod._id.substr(1),
        testServer: server.address()
    }));

    await closeServer(server);
});

test("Error fetching log frament", async (t) => {
    const server = await createServer(2);
    await t.throws(getChatlog({
        vodId: vod._id.substr(1),
        testServer: server.address()
    }));

    await closeServer(server);
});
