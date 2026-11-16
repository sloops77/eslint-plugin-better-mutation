const test = require('node:test');
const assert = require('node:assert/strict');
const {rules, defaults} = require('../index');

test('import rules', () => {
  assert.deepEqual(Object.keys(rules).toSorted(), [
    'no-mutating-functions',
    'no-mutating-methods',
    'no-mutation',
  ].toSorted());
});

test('default values exported', () => {
  assert.deepEqual(Object.keys(defaults).toSorted(), ['defaultInitializers', 'defaultReducers'].toSorted());
});
