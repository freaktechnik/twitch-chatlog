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
        expectedResult: `${chalk.gray(timeSection)} ${chalk.yellow.bold("<test>")} foo bar`
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
        expectedResult: `${chalk.gray(timeSection)} ${chalk.hex('#ffffff').bold("<test>")} foo
${chalk.gray(timeSection)} ${chalk.hex('#000000').bold("<test>")} bar`
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
        expectedResult: `${chalk.gray(timeSection)} ${chalk.hex('#ffffff').bold("<test>")} foo`
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
        expectedResult: `${chalk.gray(timeSection)} ${chalk.hex('#000000').bold("<test>")} foo`
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
        expectedResult: `${chalk.gray(timeSection)} ${chalk.hex('#0f0f0f').bold("<test>")} foo`
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
        expectedResult: `${chalk.gray(timeSection)} ${chalk.hex('#ff0000').bold("<test>")} foo`
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
        expectedResult: `${chalk.gray(timeSection)} ${chalk.hex('#00ff00').bold("<test>")} foo`
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
        expectedResult: `${chalk.gray(timeSection)} ${chalk.hex('#0000ff').bold("<test>")} foo`
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
        expectedResult: `${chalk.gray(timeSection)} ${chalk.hex('#ffff00').bold("<test>")} foo`
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
        expectedResult: `${chalk.gray(timeSection)} ${chalk.hex('#ff00ff').bold("<test>")} foo`
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
        expectedResult: `${chalk.gray(timeSection)} ${chalk.hex('#00ffff').bold("<test>")} foo`
    },
    {
        messages: [],
        name: "Test empty set",
        color: false,
        expectedResult: ""
    },
    {
        messages: [ {
            commenter: {
                name: "test"
            },
            message: {
                body: "foo",
                "is_action": true
            },
            "created_at": timestamp,
            source: "chat"
        } ],
        name: "Test uncolorized action",
        color: false,
        expectedResult: `${timeSection} ** test foo`
    },
    {
        messages: [ {
            commenter: {
                name: "test"
            },
            message: {
                body: "foo",
                "is_action": true
            },
            "created_at": timestamp,
            source: "chat"
        } ],
        name: "Test colorized action",
        color: true,
        expectedResult: `${chalk.gray(timeSection)} ${chalk.italic.yellow.bold('** test')} ${chalk.italic('foo')}`
    }
];

const testFunction = (t, data) => {
    t.is(printResults(data.messages, data.color), data.expectedResult);
};

testData.forEach((data) => {
    test(data.name, testFunction, data);
});

test.todo("Badges");
