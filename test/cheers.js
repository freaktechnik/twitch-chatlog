import test from 'ava';
import * as cheers from '../lib/cheers.js';

const CHEER_INFO = [
    {
        from: 0,
        to: 99,
        textColors: false,
        colors: false,
        character: false
    },
    {
        from: 100,
        to: 999,
        textColors: false,
        colors: true,
        character: true
    },
    {
        from: 1000,
        to: 4999,
        textColors: false,
        colors: true,
        character: true
    },
    {
        from: 5000,
        to: 9999,
        textColors: false,
        colors: true,
        character: true
    },
    {
        from: 10000,
        to: 24999,
        textColors: true,
        colors: true,
        character: true
    },
    {
        from: 25000,
        to: 49999,
        textColors: true,
        colors: true,
        character: true
    },
    {
        from: 50000,
        to: 74999,
        textColors: true,
        colors: true,
        character: false
    },
    {
        from: 75000,
        to: 99999,
        textColors: true,
        colors: true,
        character: false
    },
    {
        from: 100000,
        to: 199999,
        textColors: true,
        colors: true,
        character: true
    },
    {
        from: 200000,
        to: 299999,
        textColors: true,
        colors: true,
        character: false
    },
    {
        from: 300000,
        to: 399999,
        textColors: true,
        colors: false,
        character: false
    },
    {
        from: 400000,
        to: 499999,
        textColors: true,
        colors: false,
        character: false
    },
    {
        from: 500000,
        to: 599999,
        textColors: true,
        colors: false,
        character: false
    },
    {
        from: 600000,
        to: 699999,
        textColors: true,
        colors: false,
        character: false
    },
    {
        from: 700000,
        to: 799999,
        textColors: true,
        colors: false,
        character: false
    },
    {
        from: 800000,
        to: 899999,
        textColors: true,
        colors: false,
        character: false
    },
    {
        from: 900000,
        to: 999999,
        textColors: true,
        colors: false,
        character: false
    },
    {
        from: 1000000,
        to: 1249999,
        textColors: true,
        colors: false,
        character: false
    },
    {
        from: 1250000,
        to: 1499999,
        textColors: true,
        colors: true,
        character: true
    },
    {
        from: 1500000,
        to: 1749999,
        textColors: false,
        colors: true,
        character: true
    },
    {
        from: 1750000,
        to: 1999999,
        textColors: false,
        colors: true,
        character: true
    },
    {
        from: 2000000,
        to: 2499999,
        textColors: false,
        colors: true,
        character: true
    },
    {
        from: 2500000,
        to: 2999999,
        textColors: false,
        colors: true,
        character: true
    },
    {
        from: 3000000,
        to: 3499999,
        textColors: false,
        colors: true,
        character: true
    },
    {
        from: 3500000,
        to: 3999999,
        textColors: false,
        colors: true,
        character: true
    },
    {
        from: 4000000,
        to: 4499999,
        textColors: false,
        colors: true,
        character: true
    },
    {
        from: 4500000,
        to: 4999999,
        textColors: false,
        colors: true,
        character: true
    },
    {
        from: 5000000,
        to: Number.POSITIVE_INFINITY,
        textColors: false,
        colors: true,
        character: false
    }
];

const testMethod = (t, method, range) => {
    const previousValue = cheers[method](range.from - 1);
    const value = cheers[method](range.from);
    if(range[method]) {
        t.not(value, previousValue);
    }
    else {
        t.is(value, previousValue);
    }
    if(range.to < Number.POSITIVE_INFINITY) {
        t.is(cheers[method](range.to), value);
    }
    else {
        t.is(cheers[method](range.from ** 2), value);
    }
};
testMethod.title = (t, method, range) => `${t} ${method}(${range.from} - ${range.to})`;

const methods = [
    'textColors',
    'colors',
    'character'
];
for(const range of CHEER_INFO) {
    for(const method of methods) {
        test('cheers', testMethod, method, range);
    }
}
