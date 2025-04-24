const test = require('ava');
const AvaRuleTester = require('eslint-ava-rule-tester').default;
const rule = require('../rules/no-mutating-functions');

const ruleTester = new AvaRuleTester(test, {
  languageOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
  },
});

const error = {
  message: 'Unsafe mutating functions are disallowed',
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
      options: [{functionProps: true}],
    },
    'function fn () {const o = {}; Object.defineProperty(o, "foo")}',
    {
      code: 'function fn() {}; Object.defineProperty(fn, "foo");',
      options: [{functionProps: true}],
    },
    'let array = [1,2,3]; _.reduce((acc, x) => Object.assign(acc, { [x]: x }), {}, array);',
  ],
  invalid: [
    {
      code: 'Object.assign();',
      errors: [error],
    },
    {
      code: 'assign();',
      options: [{
        useLodashFunctionImports: true,
      }],
      errors: [error],
    },
    {
      code: 'Object.assign();',
      options: [{
        ignoredMethods: ['Object.assign'],
      }],
      errors: [error],
    },
    {
      code: '_.defaults(a);',
      errors: [error],
    },
    {
      code: '_.assign(a, b);',
      errors: [error],
    },
    {
      code: 'Object.assign(a);',
      errors: [error],
    },
    {
      code: 'Object.assign(a, b);',
      errors: [error],
    },
    {
      code: 'Object.assign(a, b, c, d, e);',
      errors: [error],
    },
    {
      code: 'var fn = () => {}; Object.assign(fn, b);',
      errors: [error],
    },
    {
      code: 'function fn() {}; Object.assign(fn, b);',
      errors: [error],
    },
    {
      code: 'var a; Object.assign(a, b);',
      errors: [error],
    },
    {
      code: 'function fn(b) { var a = b; Object.assign(a, c); }',
      errors: [error],
    },
    {
      code: 'function fn(b) { var a = b.foo; Object.assign(a, c); }',
      errors: [error],
    },
    {
      code: 'var a = {foo: 1, bar: 2}; function fn() { Object.assign(a, b); }',
      errors: [error],
    },
    {
      code: 'function fn(b) { var a = x === 1 ? b : { foo: 1 }; Object.assign(a, c); }',
      errors: [error],
    },
    {
      code: 'Object.defineProperties(a)',
      errors: [error],
    },
    {
      code: 'Object.defineProperty(a)',
      errors: [error],
    },
    {
      code: 'Object.setPrototypeOf(a)',
      errors: [error],
    },
    {
      code: 'let array = [1,2,3]; _.reduce((acc, x) => Object.assign(acc, { [x]: x }), {}, array);',
      options: [{reducers: []}],
      errors: [error],
    },
  ],
});
