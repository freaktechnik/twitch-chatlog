import test from 'ava';
import mock from 'mock-json-api';
import express from 'express';
import vod from './api/v79240813.json';
import rechatMessage from './api/rechat-message.json';
import { getChatlog } from '../lib';

var s;
test.before(() => {
    const server = express();

    const mockapi = mock({
        jsonStore: __dirname + '/data.json',
        mockRoutes: [
            {
                name: "VOD info",
                mockRoute: '/kraken/videos/v79240813',
                testScope: "success",
                jsonTemplate: [
                    function() {
                        return JSON.stringify(vod);
                    }
                ]
            },
            {
                name: "Chat log fragment",
                mockRoute: '/rechat-message',
                testScope: "success",
                jsonTemplate: [
                    function() {
                        return JSON.stringify(rechatMessage);
                    }
                ]
            }
        ]
    });

    server.use(mockapi.registerRoutes);
    s = server.listen(3001);
    process.env.TEST = true;
});

test("Test getting message", async function(t) {
    const result = await getChatlog({
        vodId: vod._id,
        start: 0,
        length: 30
    });

    t.is(result.length, 1);
    t.deepEqual(result, rechatMessage.data);
});

test("Getting multiple fragments using length", async function(t) {
    const result = await getChatlog({
        vodId: vod._id,
        start: 0,
        length: 60
    });

    t.is(result.length, 2);
});

test("Getting a partial fragment returns the whole fragment", async function(t) {
    const result = await getChatlog({
        vodId: vod._id,
        start: 0,
        length: 45
    });

    t.is(result.length, 2);
});

test("Getting a partial log based on relative end", async function(t) {
    const result = await getChatlog({
        vodId: vod._id,
        end: "00:03:00"
    });

    t.is(result.length, 6);
});

test("Getting a partial log based on relative start and end", async function(t) {
    const result = await getChatlog({
        vodId: vod._id,
        start: "00:01:00",
        end: "00:03:00"
    });

    t.is(result.length, 4);
});

test("Getting a partial log based on absolute start and relative end", async function(t) {
    const result = await getChatlog({
        vodId: vod._id,
        start: new Date(Date.parse(vod.recorded_at)+60000).toString(),
        end: "00:03:20"
    });

    t.is(result.length, 5);
});

test("Getting a partial log based on absolute end", async function(t) {
    const result = await getChatlog({
        vodId: vod._id,
        end: new Date(Date.parse(vod.recorded_at)+60000).toString()
    });

    t.is(result.length, 2);
});

test("Getting all fragments to a vod", async function(t) {
    const result = await getChatlog({
        vodId: vod._id
    });

    t.is(result.length, Math.ceil(vod.length/30));
});

test.after(() => {
    s.close();
    process.env.TEST = false
});
