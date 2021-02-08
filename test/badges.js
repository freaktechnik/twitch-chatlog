import test from 'ava';
import formatBadge from '../lib/badges.js';

test('unknown badge', (t) => {
    const result = formatBadge({
        _id: 'foo-bar'
    });
    t.is(result, 'fo');
});
