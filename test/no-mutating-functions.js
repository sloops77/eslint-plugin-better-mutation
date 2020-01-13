import test from 'ava';
import avaRuleTester from 'eslint-ava-rule-tester';
import rule from '../rules/no-mutating-functions';

const ruleTester = avaRuleTester(test, {
  env: {
    es6: true
  },
  parserOptions: {
    sourceType: 'module'
  }
});

const error = {
  ruleId: 'no-mutating-functions',
  message: 'Unallowed use of mutating functions'
};

ruleTester.run('no-mutating-functions', rule, {
  valid: [
    'foo.bar(a, b);',
    'assign();',
    'foo.assign(a, b);',
    'Object.foo(a, b);',
    'Object.assign({});',
    '_.assign({});',
    'Object.assign({}, b);',
    'Object.assign({}, b, c, d, e);',
    'Object.assign({foo: 1, bar: 2}, b);',
    'Object.assign([1, 2], b);',
    'Object.assign(() => {}, a);',
    'Object.assign(function() {}, a);',
    'Object.assign(function foo() {}, a);',
    'var a = {foo: 1, bar: 2}; Object.assign(a, b);',
    'function fn() { var a = {foo: 1, bar: 2}; Object.assign(a, b); }',
    'function fn(b) { var a = {foo: 1, bar: 2}; Object.assign(a, b); }',
    'var b = {}; var a = b; Object.assign(a, b);',
    'var b = {foo: 1}; var a = b.foo; Object.assign(a, c);',
    'var a = x === 1 ? {} : { foo: 1 }; Object.assign(a, c);',
    'var b = {}; var a = x === 1 ? b : { foo: 1 }; Object.assign(a, c);',
    'var b = { x: {} }; Object.assign(b.x, {a: 1})',
    {
      code: 'function fn() {}; Object.assign(fn, b);',
      options: [{functionProps: true}]
    }
  ],
  invalid: [
    {
      code: 'Object.assign();',
      errors: [error]
    },
    {
      code: 'assign();',
      options: [{
        useLodashFunctionImports: true
      }],
      errors: [error]
    },
    {
      code: 'Object.assign();',
      options: [{
        ignoredMethods: ['Object.assign']
      }],
      errors: [error]
    },
    {
      code: '_.defaults(a);',
      errors: [error]
    },
    {
      code: '_.assign(a, b);',
      errors: [error]
    },
    {
      code: 'Object.assign(a);',
      errors: [error]
    },
    {
      code: 'Object.assign(a, b);',
      errors: [error]
    },
    {
      code: 'Object.assign(a, b, c, d, e);',
      errors: [error]
    },
    {
      code: 'var fn = () => {}; Object.assign(fn, b);',
      errors: [error]
    },
    {
      code: 'function fn() {}; Object.assign(fn, b);',
      errors: [error]
    },
    {
      code: 'var a; Object.assign(a, b);',
      errors: [error]
    },
    {
      code: 'function fn(b) { var a = b; Object.assign(a, c); }',
      errors: [error]
    },
    {
      code: 'function fn(b) { var a = b.foo; Object.assign(a, c); }',
      errors: [error]
    },
    {
      code: 'var a = {foo: 1, bar: 2}; function fn() { Object.assign(a, b); }',
      errors: [error]
    },
    {
      code: 'function fn(b) { var a = x === 1 ? b : { foo: 1 }; Object.assign(a, c); }',
      errors: [error]
    }
  ]
});
