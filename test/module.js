const test = require('node:test');
const assert = require('node:assert/strict');
const {rules, defaults} = require('../index');

test('import rules', () => {
  assert.deepEqual(new Set(Object.keys(rules)), new Set([
    'no-mutating-functions',
    'no-mutating-methods',
    'no-mutation',
  ]));
});

test('default values exported', () => {
  assert.deepEqual(new Set(Object.keys(defaults)), new Set(['defaultInitializers', 'defaultReducers']));
});
