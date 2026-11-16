const test = require('node:test');
const assert = require('node:assert/strict');
const {isExemptedInitializer} = require('../../rules/utils/common');

test('should return false if rhsExpression is not a CallExpression', () => {
  const rhsExpression = {type: 'Literal'};
  const exemptedInitializers = ['someFunction'];
  assert.equal(isExemptedInitializer(rhsExpression, exemptedInitializers), false);
});

test('should return false if exemptedInitializers is null or undefined', () => {
  const rhsExpression = {
    type: 'CallExpression',
    callee: {name: 'someFunction'},
  };
  assert.equal(isExemptedInitializer(rhsExpression, null), false);
  assert.equal(isExemptedInitializer(rhsExpression, undefined), false);
});

test('should return true if exemptedInitializers contains the initializer', () => {
  const rhsExpression = {
    type: 'CallExpression',
    callee: {name: 'someFunction'},
  };
  const exemptedInitializers = ['someFunction'];
  assert.equal(isExemptedInitializer(rhsExpression, exemptedInitializers), true);
});

test('should return false if exemptedInitializers does not contain the initializer', () => {
  const rhsExpression = {
    type: 'CallExpression',
    callee: {name: 'anotherFunction'},
  };
  const exemptedInitializers = ['someFunction'];
  assert.equal(isExemptedInitializer(rhsExpression, exemptedInitializers), false);
});

test('should handle recursive cases with callee.object', () => {
  const rhsExpression = {
    type: 'CallExpression',
    callee: {
      object: {
        type: 'CallExpression',
        callee: {name: 'nestedFunction'},
      },
    },
  };
  const exemptedInitializers = ['nestedFunction'];
  assert.equal(isExemptedInitializer(rhsExpression, exemptedInitializers), true);
});
