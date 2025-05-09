const test = require('ava');
const { isExemptedInitializer } = require('../../rules/utils/common');

test('should return false if rhsExpression is not a CallExpression', t => {
  const rhsExpression = { type: 'Literal' };
  const exemptedInitializers = ['someFunction'];
  t.false(isExemptedInitializer(rhsExpression, exemptedInitializers));
});

test('should return false if exemptedInitializers is null or undefined', t => {
  const rhsExpression = {
    type: 'CallExpression',
    callee: { name: 'someFunction' },
  };
  t.false(isExemptedInitializer(rhsExpression, null));
  t.false(isExemptedInitializer(rhsExpression, undefined));
});

test('should return true if exemptedInitializers contains the initializer', t => {
  const rhsExpression = {
    type: 'CallExpression',
    callee: { name: 'someFunction' },
  };
  const exemptedInitializers = ['someFunction'];
  t.true(isExemptedInitializer(rhsExpression, exemptedInitializers));
});

test('should return false if exemptedInitializers does not contain the initializer', t => {
  const rhsExpression = {
    type: 'CallExpression',
    callee: { name: 'anotherFunction' },
  };
  const exemptedInitializers = ['someFunction'];
  t.false(isExemptedInitializer(rhsExpression, exemptedInitializers));
});

test('should handle recursive cases with callee.object', t => {
  const rhsExpression = {
    type: 'CallExpression',
    callee: {
      object: {
        type: 'CallExpression',
        callee: { name: 'nestedFunction' },
      },
    },
  };
  const exemptedInitializers = ['nestedFunction'];
  t.true(isExemptedInitializer(rhsExpression, exemptedInitializers));
});
