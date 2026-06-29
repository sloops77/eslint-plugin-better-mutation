const ava = require('ava');
const {rules, defaults} = require('../index');

const test = ava.default ?? ava;

test('import rules', t => {
  t.deepEqual(Object.keys(rules).toSorted(), [
    'no-mutating-functions',
    'no-mutating-methods',
    'no-mutation',
  ].toSorted());
});

test('default values exported', t => {
  t.deepEqual(Object.keys(defaults).toSorted(), ['defaultInitializers', 'defaultReducers'].toSorted());
});
