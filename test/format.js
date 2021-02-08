import test from 'ava';
import {
    TextStream,
    JSONStream
} from '../lib/format';
import chalk from 'chalk';
import toArray from 'stream-to-array';
import { Readable } from 'stream';

const date = new Date();
const timestamp = date.getTime();
const timestampFormatter = new Intl.DateTimeFormat(undefined, {
    year: '2-digit',
    month: '2-digit',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
});
const printedTime = timestampFormatter.format(date);
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
        expectedResult: [ `[${printedTime}] <Test> foo bar
` ]
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
        expectedResult: [ `[${printedTime}] <test> foo bar
` ]
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
        expectedResult: [
            `[${printedTime}] <test> foo
`,
            `[${printedTime}] <freaktechnik> bar
`
        ]
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
        expectedResult: [ `${chalk.gray(timeSection)} ${chalk.yellow.bold("<test>")} foo bar
` ]
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
        expectedResult: [
            `${chalk.gray(timeSection)} ${chalk.hex('#ffffff').bold("<test>")} foo
`,
            `${chalk.gray(timeSection)} ${chalk.hex('#000000').bold("<test>")} bar
`
        ]
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
        expectedResult: [ `${chalk.gray(timeSection)} ${chalk.hex('#ffffff').bold("<test>")} foo
` ]
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
        expectedResult: [ `${chalk.gray(timeSection)} ${chalk.hex('#000000').bold("<test>")} foo
` ]
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
        expectedResult: [ `${chalk.gray(timeSection)} ${chalk.hex('#0f0f0f').bold("<test>")} foo
` ]
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
        expectedResult: [ `${chalk.gray(timeSection)} ${chalk.hex('#ff0000').bold("<test>")} foo
` ]
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
        expectedResult: [ `${chalk.gray(timeSection)} ${chalk.hex('#00ff00').bold("<test>")} foo
` ]
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
        expectedResult: [ `${chalk.gray(timeSection)} ${chalk.hex('#0000ff').bold("<test>")} foo
` ]
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
        expectedResult: [ `${chalk.gray(timeSection)} ${chalk.hex('#ffff00').bold("<test>")} foo
` ]
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
        expectedResult: [ `${chalk.gray(timeSection)} ${chalk.hex('#ff00ff').bold("<test>")} foo
` ]
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
        expectedResult: [ `${chalk.gray(timeSection)} ${chalk.hex('#00ffff').bold("<test>")} foo
` ]
    },
    {
        messages: [],
        name: "Test empty set",
        color: false,
        expectedResult: []
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
        expectedResult: [ `${timeSection} ** test foo
` ]
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
        expectedResult: [ `${chalk.gray(timeSection)} ${chalk.italic.yellow.bold('** test')} ${chalk.yellow.italic('foo')}
` ]
    }
];

const testFunction = async (t, data) => {
    const messagesStream = Readable.from(data.messages); // eslint-disable-line node/no-unsupported-features/node-builtins
    const stream = new TextStream({
        colorized: data.color,
        loadImages: false
    });
    const result = await toArray(messagesStream.pipe(stream));

    t.deepEqual(await result, data.expectedResult);
};
testFunction.title = (title, data) => `${title}: rich ${data.name}`;

const testJSONStream = async (t, data) => {
    const messagesStream = Readable.from(data.messages); // eslint-disable-line node/no-unsupported-features/node-builtins
    const stream = new JSONStream();
    const result = await toArray(messagesStream.pipe(stream));
    const expectedResult = data.messages.map((message, index) => {
        const stringified = JSON.stringify(message);
        const prefix = index === 0 ? '[' : ',';
        return prefix + stringified;
    });
    if(expectedResult.length === 0) {
        expectedResult.push('[]');
    }
    else {
        expectedResult.push(']');
    }

    t.deepEqual(await result, expectedResult);
};
testJSONStream.title = (title, data) => `${title}: json ${data.name}`;

for(const data of testData) {
    test('formatting', [
        testFunction,
        testJSONStream
    ], data);
}

test.todo("Badges");
