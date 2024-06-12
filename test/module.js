const test = require('ava');
const {rules, defaults} = require('../index');

test('import rules', t => {
  t.deepEqual(Object.keys(rules).sort(), [
    'no-mutating-functions',
    'no-mutating-methods',
    'no-mutation',
  ].sort());
});

test('default values exported', t => {
  t.deepEqual(Object.keys(defaults).sort(), ['defaultInitializers', 'defaultReducers'].sort());
});
