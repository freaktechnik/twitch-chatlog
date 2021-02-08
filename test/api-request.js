import test from 'ava';
import express from 'express';
import apiRequest from '../lib/api-request.js';

const createServer = (error) => {
    const server = express();

    if(!error) {
        server.get('/test', (request, response) => {
            response.json({ foo: 'bar' });
        });
    }

    return new Promise((resolve) => {
        const serverInstance = server.listen(0, () => resolve(serverInstance));
    });
};

const closeServer = (server) => new Promise((resolve) => server.close(resolve));

test('makes request to testServer', async (t) => {
    const server = await createServer();
    t.teardown(() => closeServer(server));
    const result = await apiRequest('/test', 'foo', 'bar', server.address());

    t.deepEqual(result, { foo: 'bar' });
});

test('error from testServer', async (t) => {
    const server = await createServer(true);
    t.teardown(() => closeServer(server));
    await t.throwsAsync(apiRequest('/test', 'foo', 'bar', server.address()), {
        name: 'RequestError',
        message: 'bar: Not Found'
    });
});

test.todo('ensure client ID and other headers are sent as expected');
