const test = require('ava');
const avaRuleTester = require('eslint-ava-rule-tester');
const rule = require('../rules/no-mutating-methods');

const ruleTester = avaRuleTester(test, {
  env: {
    es6: true
  },
  parserOptions: {
    sourceType: 'module'
  }
});

const methodError = methodName => ({
  message: `The use of method \`${methodName}\` is not allowed as it might be a mutating method`
});

ruleTester.run('no-mutating-methods', rule, {
  valid: [
    'value.foo()',
    'value.bar()',
    'value.concat()',
    'value["foo"](a)',
    '[].push(a)',
    'function foo() { const a = []; a.push(5); return a; }',
    {
      code: '_.push(a, b)',
      options: [{
        allowedObjects: ['_']
      }]
    },
    {
      code: '_.sort(a, b)',
      options: [{
        allowedObjects: ['_']
      }]
    },
    {
      code: 'R.reverse(a, b)',
      options: [{
        allowedObjects: ['R']
      }]
    },
    {
      code: 'R.sort(a, b)',
      options: [{
        allowedObjects: ['R']
      }]
    },
    'Object.keys(a)',
    'Object.values(a)',
    'var value = []; value.copyWithin(a);',
    'let array = [1,2,3]; reduce((acc, x) => { acc.push(1); return acc; }, array);',
    'let array = [1,2,3]; array.reduce((acc, x) => { acc.push(1); return acc; });',
    'let array = [1,2,3]; array.reduce((acc, x) => { if (x==1) { acc.push(1); } return acc; });'
  ],
  invalid: [
    {
      code: 'value.copyWithin(a);',
      errors: [methodError('copyWithin')]
    },
    {
      code: 'var value; value.copyWithin(a);',
      errors: [methodError('copyWithin')]
    },
    {
      code: 'value.pop(a);',
      errors: [methodError('pop')]
    },
    {
      code: 'value.push(a);',
      errors: [methodError('push')]
    },
    {
      code: 'value.reverse(a);',
      errors: [methodError('reverse')]
    },
    {
      code: 'value.shift(a);',
      errors: [methodError('shift')]
    },
    {
      code: 'value.sort(a);',
      errors: [methodError('sort')]
    },
    {
      code: 'value.splice(a);',
      errors: [methodError('splice')]
    },
    {
      code: 'value.unshift(a);',
      errors: [methodError('unshift')]
    },
    {
      code: 'value.watch(a);',
      errors: [methodError('watch')]
    },
    {
      code: 'value.unwatch(a);',
      errors: [methodError('unwatch')]
    },
    {
      code: '_.sort(a)',
      errors: [methodError('sort')]
    },
    {
      code: 'value["push"](a)',
      errors: [methodError('push')]
    },
    {
      code: 'value["pop"](a)',
      errors: [methodError('pop')]
    },
    {
      code: 'value.push(a)',
      options: [{
        allowedObjects: ['foo']
      }],
      errors: [methodError('push')]
    },
    {
      code: 'R.sort(a)',
      options: [{
        allowedObjects: ['_']
      }],
      errors: [methodError('sort')]
    },
    {
      code: 'R.sort(a)',
      options: [{
        allowedObjects: ['ramda']
      }],
      errors: [methodError('sort')]
    },
    {
      code: 'R.foo().sort(a)',
      options: [{
        allowedObjects: ['R']
      }],
      errors: [methodError('sort')]
    },
    {
      code: 'R.foo.sort(a)',
      options: [{
        allowedObjects: ['R']
      }],
      errors: [methodError('sort')]
    },
    {
      code: 'foo().sort(a)',
      errors: [methodError('sort')]
    },
    {
      code: 'R().sort(a)',
      options: [{
        allowedObjects: ['R']
      }],
      errors: [methodError('sort')]
    },
    {
      code: 'let array = [1,2,3]; array.reduce((acc, x) => { acc.push(1); return acc; });',
      options: [{reducers: []}],
      errors: [methodError('push')]
    }
  ]
});
