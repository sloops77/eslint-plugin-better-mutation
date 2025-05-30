const test = require('ava');
const AvaRuleTester = require('eslint-ava-rule-tester').default;
const rule = require('../rules/no-mutating-methods');

const ruleTester = new AvaRuleTester(test, {
  languageOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
  },
});

const methodError = methodName => ({
  message: `Unsafe mutating method \`${methodName}\` is disallowed`,
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
        allowedObjects: ['_'],
      }],
    },
    {
      code: '_.sort(a, b)',
      options: [{
        allowedObjects: ['_'],
      }],
    },
    {
      code: 'R.reverse(a, b)',
      options: [{
        allowedObjects: ['R'],
      }],
    },
    {
      code: 'R.sort(a, b)',
      options: [{
        allowedObjects: ['R'],
      }],
    },
    // {
    //   code: '_.sort(a).reverse()',
    //   options: [{
    //     allowedObjects: ['_'],
    //   }],
    // },
    'Object.keys(a)',
    'Object.values(a)',
    'var value = []; value.copyWithin(a);',
    'let array = [1,2,3]; reduce((acc, x) => { acc.push(1); return acc; }, array);',
    'let array = [1,2,3]; array.reduce((acc, x) => { acc.push(1); return acc; });',
    'let array = [1,2,3]; array.reduce((acc, x) => { if (x==1) { acc.push(1); } return acc; });',
    'const myObject = {a: 1, b:2}; Object.keys(myObject).sort(mySortFn)',
    'const myObject = {a: 1, b:2}; Object.keys(myObject).sort(mySortFn).reverse()',
    'const myObject = {a: 1, b:2}; structuredClone(myObject).sort(mySortFn).reverse()',
    `const arr = [];
    for (const foo of foos) {
      const [, ...rest] = foo.bars;
      for (const elem of rest) {
        arr.push(elem);
      }
    }`,
  ],
  invalid: [
    {
      code: 'value.copyWithin(a);',
      errors: [methodError('copyWithin')],
    },
    {
      code: 'var value; value.copyWithin(a);',
      errors: [methodError('copyWithin')],
    },
    {
      code: 'value.pop(a);',
      errors: [methodError('pop')],
    },
    {
      code: 'value.push(a);',
      errors: [methodError('push')],
    },
    {
      code: 'value.reverse(a);',
      errors: [methodError('reverse')],
    },
    {
      code: 'value.shift(a);',
      errors: [methodError('shift')],
    },
    {
      code: 'value.sort(a);',
      errors: [methodError('sort')],
    },
    {
      code: 'value.splice(a);',
      errors: [methodError('splice')],
    },
    {
      code: 'value.unshift(a);',
      errors: [methodError('unshift')],
    },
    {
      code: 'value.watch(a);',
      errors: [methodError('watch')],
    },
    {
      code: 'value.unwatch(a);',
      errors: [methodError('unwatch')],
    },
    {
      code: '_.sort(a)',
      errors: [methodError('sort')],
    },
    {
      code: 'value["push"](a)',
      errors: [methodError('push')],
    },
    {
      code: 'value["pop"](a)',
      errors: [methodError('pop')],
    },
    {
      code: 'value.push(a)',
      options: [{
        allowedObjects: ['foo'],
      }],
      errors: [methodError('push')],
    },
    {
      code: 'R.sort(a)',
      options: [{
        allowedObjects: ['_'],
      }],
      errors: [methodError('sort')],
    },
    {
      code: 'R.sort(a)',
      options: [{
        allowedObjects: ['ramda'],
      }],
      errors: [methodError('sort')],
    },
    {
      code: 'R.foo().sort(a)',
      options: [{
        allowedObjects: ['R'],
      }],
      errors: [methodError('sort')],
    },
    {
      code: 'R.foo.sort(a)',
      options: [{
        allowedObjects: ['R'],
      }],
      errors: [methodError('sort')],
    },
    {
      code: 'foo().sort(a)',
      errors: [methodError('sort')],
    },
    {
      code: 'R().sort(a)',
      options: [{
        allowedObjects: ['R'],
      }],
      errors: [methodError('sort')],
    },
    {
      code: 'let array = [1,2,3]; array.reduce((acc, x) => { acc.push(1); return acc; });',
      options: [{reducers: []}],
      errors: [methodError('push')],
    },
  ],
});
