import test from 'ava';
import { printResults } from '../lib/';
import chalk from 'chalk';

const date = new Date();
const timestamp = date.getTime();
const printedTime = date.toTimeString();
const timeSection = `[${printedTime}]`;
const testData = [
    {
        messages: [ {
            message: {
                body: "foo bar"
            },
            commenter: {
                name: "test",
                "display_name": "Test"
            },
            source: "chat",
            "created_at": timestamp
        } ],
        name: 'single colorless message with display name',
        color: false,
        expectedResult: `[${printedTime}] <Test> foo bar`
    },
    {
        messages: [ {
            commenter: {
                name: "test"
            },
            message: {
                body: "foo bar"
            },
            "created_at": timestamp,
            source: "chat"
        } ],
        name: 'single colorless message without display name',
        color: false,
        expectedResult: `[${printedTime}] <test> foo bar`
    },
    {
        messages: [
            {
                commenter: {
                    name: "test"
                },
                message: {
                    body: "foo"
                },
                "created_at": timestamp,
                source: "chat"
            },
            {
                commenter: {
                    name: "freaktechnik"
                },
                message: {
                    body: "bar"
                },
                "created_at": timestamp,
                source: "chat"
            }
        ],
        name: 'multiple colorless messages',
        color: false,
        expectedResult: `[${printedTime}] <test> foo
[${printedTime}] <freaktechnik> bar`
    },
    {
        messages: [ {
            commenter: {
                name: "test"
            },
            message: {
                body: "foo bar"
            },
            "created_at": timestamp,
            source: "chat"
        } ],
        name: 'colored message with default colors',
        color: true,
        expectedResult: `${chalk.gray(timeSection)} ${chalk.bold.yellow("<test>")} foo bar`
    },
    {
        messages: [
            {
                commenter: {
                    name: "test"
                },
                message: {
                    body: "foo",
                    "user_color": "#ffffff"
                },
                "created_at": timestamp,
                source: "chat"
            },
            {
                commenter: {
                    name: "test"
                },
                message: {
                    body: "bar",
                    "user_color": "#000000"
                },
                "created_at": timestamp,
                source: "chat"
            }
        ],
        name: 'colored messages with set user color',
        color: true,
        expectedResult: `${chalk.gray(timeSection)} ${chalk.bold.white("<test>")} foo
${chalk.gray(timeSection)} ${chalk.bold.black("<test>")} bar`
    },
    {
        messages: [ {
            commenter: {
                name: "test"
            },
            message: {
                body: "foo",
                "user_color": "#ffffff"
            },
            "created_at": timestamp,
            source: "chat"
        } ],
        name: "Test white nick color",
        color: true,
        expectedResult: `${chalk.gray(timeSection)} ${chalk.bold.white("<test>")} foo`
    },
    {
        messages: [ {
            commenter: {
                name: "test"
            },
            message: {
                body: "foo",
                "user_color": "#000000"
            },
            "created_at": timestamp,
            source: "chat"
        } ],
        name: "Test black nick color",
        color: true,
        expectedResult: `${chalk.gray(timeSection)} ${chalk.bold.black("<test>")} foo`
    },
    {
        messages: [ {
            commenter: {
                name: "test"
            },
            message: {
                body: "foo",
                "user_color": "#0f0f0f"
            },
            "created_at": timestamp,
            source: "chat"
        } ],
        name: "Test grey nick color",
        color: true,
        expectedResult: `${chalk.gray(timeSection)} ${chalk.bold.gray("<test>")} foo`
    },
    {
        messages: [ {
            commenter: {
                name: "test"
            },
            message: {
                body: "foo",
                "user_color": "#ff0000"
            },
            "created_at": timestamp,
            source: "chat"
        } ],
        name: "Test red nick color",
        color: true,
        expectedResult: `${chalk.gray(timeSection)} ${chalk.bold.red("<test>")} foo`
    },
    {
        messages: [ {
            commenter: {
                name: "test"
            },
            message: {
                body: "foo",
                "user_color": "#00ff00"
            },
            "created_at": timestamp,
            source: "chat"
        } ],
        name: "Test green nick color",
        color: true,
        expectedResult: `${chalk.gray(timeSection)} ${chalk.bold.green("<test>")} foo`
    },
    {
        messages: [ {
            commenter: {
                name: "test"
            },
            message: {
                body: "foo",
                "user_color": "#0000ff"
            },
            "created_at": timestamp,
            source: "chat"
        } ],
        name: "Test blue nick color",
        color: true,
        expectedResult: `${chalk.gray(timeSection)} ${chalk.bold.blue("<test>")} foo`
    },
    {
        messages: [ {
            commenter: {
                name: "test"
            },
            message: {
                body: "foo",
                "user_color": "#ffff00"
            },
            "created_at": timestamp,
            source: "chat"
        } ],
        name: "Test yellow nick color",
        color: true,
        expectedResult: `${chalk.gray(timeSection)} ${chalk.bold.yellow("<test>")} foo`
    },
    {
        messages: [ {
            commenter: {
                name: "test"
            },
            message: {
                body: "foo",
                "user_color": "#ff00ff"
            },
            "created_at": timestamp,
            source: "chat"
        } ],
        name: "Test magenta nick color",
        color: true,
        expectedResult: `${chalk.gray(timeSection)} ${chalk.bold.magenta("<test>")} foo`
    },
    {
        messages: [ {
            commenter: {
                name: "test"
            },
            message: {
                body: "foo",
                "user_color": "#00ffff"
            },
            "created_at": timestamp,
            source: "chat"
        } ],
        name: "Test cyan nick color",
        color: true,
        expectedResult: `${chalk.gray(timeSection)} ${chalk.bold.cyan("<test>")} foo`
    },
    {
        messages: [],
        name: "Test empty set",
        color: false,
        expectedResult: ""
    }
];

const testFunction = (t, data) => {
    t.is(printResults(data.messages, data.color), data.expectedResult);
};

testData.forEach((data) => {
    test(data.name, testFunction, data);
});
