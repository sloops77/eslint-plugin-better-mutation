const test = require('ava');
const {rules} = require('../index');

test('import rules', t => {
  t.deepEqual(new Set(Object.keys(rules)), new Set([
    'no-mutating-functions',
    'no-mutating-methods',
    'no-mutation',
  ]));
});

test('default values exported', t => {
  t.deepEqual(new Set(Object.keys(rules['no-mutation'].defaults)), new Set(['defaultInitializers', 'defaultReducers']));
});
