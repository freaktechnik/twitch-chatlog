import test from 'ava';
import { getChatlog } from '../lib';

// getChatlog tests that don't make any calls to the Twitch API

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

test("Invalid start time format rejects", (t) => {
    return t.throws(getChatlog({
        vodId: "v79240813",
        start: "0400"
    }));
});

test("Invalid end time format rejects", (t) => {
    return t.throws(getChatlog({
        vodId: "v79240813",
        end: "0400"
    }));
});

test("Invalid start time date format rejects", (t) => {
    return t.throws(getChatlog({
        vodId: "v79240813",
        start: "2016-32-32T16:75:00+0000"
    }));
});

test("Invalid end time date format rejects", (t) => {
    return t.throws(getChatlog({
        vodId: "v79240813",
        end: "2016-32-32T26:00:16+3200"
    }));
});

