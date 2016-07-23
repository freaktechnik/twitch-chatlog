import test from 'ava';
import { printResults } from '../lib/';
import colors from 'colors';

const date = new Date();
const timestamp = date.getTime();
const printedTime = date.toTimeString();
const timeSection = `[${printedTime}]`;
const tags = {};
const testData = [
    {
        messages: [
            {
                from: "test",
                message: "foo bar",
                timestamp,
                tags: {
                    "display-name": "Test"
                }
            }
        ],
        name: 'single colorless message with display name',
        color: false,
        expectedResult: `[${printedTime}] <Test> foo bar`
    },
    {
        messages: [
            {
                from: "test",
                message: "foo bar",
                timestamp,
                tags
            }
        ],
        name: 'single colorless message without display name',
        color: false,
        expectedResult: `[${printedTime}] <test> foo bar`
    },
    {
        messages: [
            {
                from: "test",
                message: "foo",
                timestamp,
                tags
            },
            {
                from: "freaktechnik",
                message: "bar",
                timestamp,
                tags
            }
        ],
        name: 'multiple colorless messages',
        color: false,
        expectedResult: `[${printedTime}] <test> foo
[${printedTime}] <freaktechnik> bar`
    },
    {
        messages: [
            {
                from: "test",
                message: "foo bar",
                timestamp,
                tags
            }
        ],
        name: 'colored message with default colors',
        color: true,
        expectedResult: timeSection.grey+" "+"<test>".yellow.bold+" foo bar"
    },
    {
        messages: [
            {
                from: "test",
                message: "foo",
                timestamp,
                tags,
                color: "#ffffff"
            },
            {
                from: "test",
                message: "bar",
                timestamp,
                tags,
                color: "#000000"
            }
        ],
        name: 'colored messages with set user color',
        color: true,
        expectedResult: timeSection.grey+" "+"<test>".white.bold+" foo\n"+
                        timeSection.grey+" "+"<test>".black.bold+" bar"
    },
    {
        messages: [
            {
                from: "test",
                message: "foo",
                timestamp,
                tags,
                color: "#ffffff"
            }
        ],
        name: "Test white nick color",
        color: true,
        expectedResult: timeSection.grey+" "+"<test>".white.bold+" foo"
    },
    {
        messages: [
            {
                from: "test",
                message: "foo",
                timestamp,
                tags,
                color: "#000000"
            }
        ],
        name: "Test black nick color",
        color: true,
        expectedResult: timeSection.grey+" "+"<test>".black.bold+" foo"
    },
    {
        messages: [
            {
                from: "test",
                message: "foo",
                timestamp,
                tags,
                color: "#0f0f0f"
            }
        ],
        name: "Test grey nick color",
        color: true,
        expectedResult: timeSection.grey+" "+"<test>".grey.bold+" foo"
    },
    {
        messages: [
            {
                from: "test",
                message: "foo",
                timestamp,
                tags,
                color: "#ff0000"
            }
        ],
        name: "Test red nick color",
        color: true,
        expectedResult: timeSection.grey+" "+"<test>".red.bold+" foo"
    },
    {
        messages: [
            {
                from: "test",
                message: "foo",
                timestamp,
                tags,
                color: "#00ff00"
            }
        ],
        name: "Test green nick color",
        color: true,
        expectedResult: timeSection.grey+" "+"<test>".green.bold+" foo"
    },
    {
        messages: [
            {
                from: "test",
                message: "foo",
                timestamp,
                tags,
                color: "#0000ff"
            }
        ],
        name: "Test blue nick color",
        color: true,
        expectedResult: timeSection.grey+" "+"<test>".blue.bold+" foo"
    },
    {
        messages: [
            {
                from: "test",
                message: "foo",
                timestamp,
                tags,
                color: "#ffff00"
            }
        ],
        name: "Test yellow nick color",
        color: true,
        expectedResult: timeSection.grey+" "+"<test>".yellow.bold+" foo"
    },
    {
        messages: [
            {
                from: "test",
                message: "foo",
                timestamp,
                tags,
                color: "#ff00ff"
            }
        ],
        name: "Test magenta nick color",
        color: true,
        expectedResult: timeSection.grey+" "+"<test>".magenta.bold+" foo"
    },
    {
        messages: [
            {
                from: "test",
                message: "foo",
                timestamp,
                tags,
                color: "#00ffff"
            }
        ],
        name: "Test cyan nick color",
        color: true,
        expectedResult: timeSection.grey+" "+"<test>".cyan.bold+" foo"
    },
    {
        messages: [],
        name: "Test empty set",
        color: false,
        expectedResult: ""
    }
];

const testFunction = (t, data) => {
    t.plan(1);
    const testMessages = data.messages.map((attributes) => ({ attributes }));
    t.is(printResults(testMessages, data.color), data.expectedResult);
};

testData.forEach((data) => {
    test(data.name, testFunction, data);
});
