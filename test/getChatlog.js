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
        vodId: "v79240813",
        start: 0,
        length: 30
    });

    t.is(result.length, 1);
    t.deepEqual(result, rechatMessage.data);
});

test("VOD ID validation rejects numbers", (t) => {
    return t.throws(getChatlog({
        vodId: 79240813
    }));
});

test("VOD ID validation rejects numbers only string", (t) => {
    return t.throws(getChatlog({
        vodId: "79240813"
    }));
});

test.after(() => {
    s.close();
    process.env.TEST = false
});
