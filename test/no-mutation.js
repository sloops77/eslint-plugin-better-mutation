import test from 'ava';
import avaRuleTester from 'eslint-ava-rule-tester';
import rule from '../rules/no-mutation';

const ruleTester = avaRuleTester(test, {
  env: {
    es6: true
  },
  parserOptions: {
    sourceType: 'module'
  }
});

const error = message => ({
  message
});
const reassignmentError = error('Unallowed reassignment');
const incrementError = error('Unallowed use of `++` operator');
const decrementError = error('Unallowed use of `--` operator');
const commonJsError = error('Unallowed reassignment. You may want to activate the `commonjs` option for this rule');
const prototypesError = error('Unallowed reassignment. You may want to activate the `prototypes` option for this rule');

ruleTester.run('no-mutation', rule, {
  valid: [
    'var a = 2;',
    'let a = 2;',
    'const a = 2;',
    'function foo(a={}) {}',
    'let a = 1; a = 2;',
    'let a = ""; if (false) { a += "b"; }',
    'var b = { x: 1 }; b.x += 1;',
    'for(var i = 0; i < 3; i+=1) {}',
    'function foo() {const a = {}; if (true) {a.b = "c"}}',
    'const a = []; a[0] = 2;',
    'const o = {}; o["name"] = 2;',
    // 'let a = 2; function() { a += 2; }',
    '_.reduce((acc, x) => { acc[2] = 1; return acc; }, [], [1,2,3])',
    '[1,2,3].reduce((acc, x) => { acc += x; return acc; }, 0)',
    'let array = [1,2,3]; array.reduce((acc, x) => { acc[2] = 1 });',
    // 'let b = c(); b = 1;', // fix isValidInit by looking at called function's return value
    {
      code: 'exports = {};',
      options: [{commonjs: true}]
    },
    {
      code: 'exports.foo = {};',
      options: [{commonjs: true}]
    },
    {
      code: 'exports.foo.bar = {};',
      options: [{commonjs: true}]
    },
    {
      code: 'module.exports = {};',
      options: [{commonjs: true}]
    },
    {
      code: 'module.exports.foo = {};',
      options: [{commonjs: true}]
    },
    {
      code: 'module.exports.foo.bar = {};',
      options: [{commonjs: true}]
    },
    {
      code: 'foo.bar = {};',
      options: [{exceptions: [
        {object: 'foo', property: 'bar'}
      ]}]
    },
    {
      code: 'foo.bar = {};',
      options: [{exceptions: [
        {object: 'foo'}
      ]}]
    },
    {
      code: 'baz.propTypes = {};',
      options: [{exceptions: [
        {property: 'propTypes'}
      ]}]
    },
    {
      code: 'module.exports = {};',
      options: [{exceptions: [
        {object: 'module', property: 'exports'}
      ]}]
    },
    {
      code: 'module.exports[foo].bar = {};',
      options: [{exceptions: [
        {object: 'module', property: 'exports'}
      ]}]
    },
    {
      code: 'module.exports.foo = {};',
      options: [{exceptions: [
        {object: 'foo', property: 'bar'},
        {object: 'module', property: 'exports'}
      ]}]
    },
    {
      code: 'foo.bar = {};',
      options: [{exceptions: [
        {object: 'foo', property: 'bar'},
        {object: 'module', property: 'exports'}
      ]}]
    },
    {
      code: 'this.foo = 100;',
      options: [{allowThis: true}]
    },
    {
      code: 'this.foo.bar = 100;',
      options: [{allowThis: true}]
    },
    {
      code: 'function bar() { this.foo = 100; }',
      options: [{allowThis: true}]
    },
    {
      code: 'class Clazz {}; Clazz.staticFoo = 3',
      options: [{functionProps: true}]
    },
    {
      code: 'export default class Clazz {}; Clazz.staticFoo = 3',
      options: [{functionProps: true}]
    },
    {
      code: 'export class Clazz {}; Clazz.staticFoo = 3',
      options: [{functionProps: true}]
    },
    {
      code: 'function foo() {}; foo.metadata = {}',
      options: [{functionProps: true}]
    },
    {
      code: 'function Clazz() { }; Clazz.prototype.foo = function() {}',
      options: [{prototypes: true}]
    }
  ],
  invalid: [
    {
      code: 'class Clazz {}; Clazz.staticFoo = 3',
      errors: [reassignmentError]
    },
    {
      code: 'function foo() {}; foo.metadata = {}',
      errors: [reassignmentError]
    },
    {
      code: 'function Clazz() { }; Clazz.prototype.foo = function() {}',
      errors: [prototypesError]
    },
    {
      code: 'a = 2;',
      errors: [reassignmentError]
    },
    {
      code: 'a += 2;',
      errors: [reassignmentError]
    },
    {
      code: 'a -= 2;',
      errors: [reassignmentError]
    },
    {
      code: 'a *= 2;',
      errors: [reassignmentError]
    },
    {
      code: 'a /= 2;',
      errors: [reassignmentError]
    },
    {
      code: 'a %= 2;',
      errors: [reassignmentError]
    },
    {
      code: 'a++;',
      errors: [incrementError]
    },
    {
      code: '++a;',
      errors: [incrementError]
    },
    {
      code: 'a--;',
      errors: [decrementError]
    },
    {
      code: '--a;',
      errors: [decrementError]
    },
    {
      code: 'function foo(a) { a = a || {}; }',
      errors: [reassignmentError]
    },
    {
      code: 'module.foo = {};',
      errors: [reassignmentError]
    },
    {
      code: 'foo.exports = {};',
      errors: [reassignmentError]
    },
    {
      code: 'exports = {};',
      errors: [commonJsError]
    },
    {
      code: 'exports.foo = {};',
      errors: [commonJsError]
    },
    {
      code: 'exports.foo.bar = {};',
      errors: [commonJsError]
    },
    {
      code: 'exports[foo] = {};',
      errors: [commonJsError]
    },
    {
      code: 'exports.foo[bar] = {};',
      errors: [commonJsError]
    },
    {
      code: 'exports[foo].bar = {};',
      errors: [commonJsError]
    },
    {
      code: 'module.exports = {};',
      errors: [commonJsError]
    },
    {
      code: 'module.exports.foo = {};',
      errors: [commonJsError]
    },
    {
      code: 'module.exports[foo] = {};',
      errors: [commonJsError]
    },
    {
      code: 'module.exports.foo[bar] = {};',
      errors: [commonJsError]
    },
    {
      code: 'module.exports[foo].bar = {};',
      errors: [commonJsError]
    },
    {
      code: 'foo.bar = {};',
      options: [{exceptions: [
        {object: 'foo', property: 'boo'}
      ]}],
      errors: [reassignmentError]
    },
    {
      code: 'baz.propTypes = {};',
      options: [{exceptions: [
        {object: 'foo'}
      ]}],
      errors: [reassignmentError]
    },
    {
      code: 'baz.propTypes = {};',
      options: [{exceptions: [
        {property: 'props'}
      ]}],
      errors: [reassignmentError]
    },
    {
      code: 'baz.propTypes = {};',
      options: [{exceptions: [{}]}],
      errors: [reassignmentError]
    },
    {
      code: 'this.foo = 100;',
      errors: [reassignmentError]
    },
    {
      code: 'this.foo.bar = 100;',
      errors: [reassignmentError]
    },
    {
      code: 'function bar() { this.foo = 100; }',
      errors: [reassignmentError]
    },
    {
      code: 'let a = 1; function bar() { a = 2; }',
      errors: [reassignmentError]
    },
    {
      code: 'a[0] = 2;',
      errors: [reassignmentError]
    },
    {
      code: 'o["name"] = 2;',
      errors: [reassignmentError]
    },
    {
      code: '_.reduce((acc, x) => { acc[2] = 1; return acc; }, [], [1,2,3])',
      options: [{reducers: []}],
      errors: [reassignmentError]
    }
  ]
});
