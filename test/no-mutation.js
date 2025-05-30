const test = require('ava');
const AvaRuleTester = require('eslint-ava-rule-tester').default;
const rule = require('../rules/no-mutation');

const ruleTester = new AvaRuleTester(test, {
  languageOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
  },
});

const error = message => ({
  message,
});
const reassignmentError = error('Reassignment is disallowed');
const incrementError = error('Use of `++` operator is disallowed');
const decrementError = error('Use of `--` operator is disallowed');
const commonJsError = error('Assignment to exports or module.exports is disallowed. You may want to activate the `commonjs` option for this rule');
const prototypesError = error('Assignment to object prototype is disallowed. You may want to activate the `prototypes` option for this rule');

ruleTester.run('no-mutation', rule, {
  valid: [
    'var a = 2;',
    'let a = 2;',
    'const a = 2;',
    'const a=2, b=1;',
    'function foo(a={}) {}',
    'let a = 1; a = 2;',
    'let a = ""; if (false) { a = "b"; }',
    'let a, b; b = 2;',
    'let a, b=0; b += 2;',
    'let a = ""; if (false) { a += "b"; }',
    'let {a, b} = {}; if (!a) { a = 1; }',
    'let {a: x, b: y} = {a: 1, b: 2}; if (!x) { x = 1; } ',
    'let {a: x, b: y} = {a: 1, b: 2}; y+=1;',
    'let [x, y] = [1,2]; y+=1;',
    'var b = { x: 1 }; b.x += 1;',
    'for(var i = 0; i < 3; i+=1) {}',
    'function foo() {const a = {}; if (true) {a.b = "c"}}',
    'function foo(bar) { let a = bar; return a; }',
    'function foo(bar) { let a = bar; if (true) {a = {}}}',
    'function foo(bar) { let a = bar; while (true) { if (true) { a = {} } } }',
    'const a = []; a[0] = 2;',
    'const a = new Array(2); a[0] = 2;',
    'const a = Array.of(1,2,3); a[0] = 2;',
    'const [omittedIndex, ...a] = []; a[0] = 2;',
    'const o = {}; o["name"] = 2;',
    'const {a, b, ...o} = {a: 10, b: 20, c: 30, d: 40, e: 50}; o["b"] = 2;',
    'const o = {...x}; o["name"] = 2;',
    'const o = Object.fromEntries(x); o["name"] = 2;',
    'const o = structuredClone(x); o["name"] = 2;',
    // 'let a = 2; function() { a += 2; }',
    '_.reduce((acc, x) => { acc[2] = 1; return acc; }, [], [1,2,3])',
    '[1,2,3].reduce((acc, x) => { acc += x; return acc; }, 0)',
    'let array = [1,2,3]; array.reduce((acc, x) => { acc[2] = 1 });',
    // 'let b = c(); b = 1;', // fix isValidInit by looking at called function's return value
    {
      code: 'exports = {};',
      options: [{commonjs: true}],
    },
    {
      code: 'exports.foo = {};',
      options: [{commonjs: true}],
    },
    {
      code: 'exports.foo.bar = {};',
      options: [{commonjs: true}],
    },
    {
      code: 'module.exports = {};',
      options: [{commonjs: true}],
    },
    {
      code: 'module.exports.foo = {};',
      options: [{commonjs: true}],
    },
    {
      code: 'module.exports.foo.bar = {};',
      options: [{commonjs: true}],
    },
    {
      code: 'foo.bar = {};',
      options: [{exceptions: [
        {object: 'foo', property: 'bar'},
      ]}],
    },
    {
      code: 'foo.bar = {};',
      options: [{exceptions: [
        {object: 'foo'},
      ]}],
    },
    {
      code: 'baz.propTypes = {};',
      options: [{exceptions: [
        {property: 'propTypes'},
      ]}],
    },
    {
      code: 'module.exports = {};',
      options: [{exceptions: [
        {object: 'module', property: 'exports'},
      ]}],
    },
    {
      code: 'module.exports[foo].bar = {};',
      options: [{exceptions: [
        {object: 'module', property: 'exports'},
      ]}],
    },
    {
      code: 'module.exports.foo = {};',
      options: [{exceptions: [
        {object: 'foo', property: 'bar'},
        {object: 'module', property: 'exports'},
      ]}],
    },
    {
      code: 'foo.bar = {};',
      options: [{exceptions: [
        {object: 'foo', property: 'bar'},
        {object: 'module', property: 'exports'},
      ]}],
    },
    {
      code: 'this.foo = 100;',
      options: [{allowThis: true}],
    },
    {
      code: 'this.foo.bar = 100;',
      options: [{allowThis: true}],
    },
    {
      code: 'function bar() { this.foo = 100; }',
      options: [{allowThis: true}],
    },
    {
      code: 'class Clazz {}; Clazz.staticFoo = 3',
      options: [{functionProps: true}],
    },
    {
      code: 'export default class Clazz {}; Clazz.staticFoo = 3',
      options: [{functionProps: true}],
    },
    {
      code: 'export class Clazz {}; Clazz.staticFoo = 3',
      options: [{functionProps: true}],
    },
    {
      code: 'function foo() {}; foo.metadata = {}',
      options: [{functionProps: true}],
    },
    {
      code: 'function Clazz() { }; Clazz.prototype.foo = function() {}',
      options: [{prototypes: true}],
    },
    {
      code: 'fold((acc, x) => { acc[2] = 1; return acc; }, [], [1,2,3])',
      options: [{reducers: ['fold']}],
    },
    'const a = new MyObject(42); a.foo = 2;',
    {
      code: 'const x = MyObject.init(42); x.foo += 1',
      options: [{initializers: ['MyObject.init']}],
    },
    {
      code: 'for(let i = 0; i < 0; i++){}',
      options: [{allowUnaryOperatorInForLoops: true}],
    },
    {
      code: 'for(let i = 0; i < 0; ++i){}',
      options: [{allowUnaryOperatorInForLoops: true}],
    },
    {
      code: 'for(let i = 3; i > 0; i--){}',
      options: [{allowUnaryOperatorInForLoops: true}],
    },
    {
      code: 'for(let i = 3; i > 0; --i){}',
      options: [{allowUnaryOperatorInForLoops: true}],
    },
  ],
  invalid: [
    {
      code: 'class Clazz {}; Clazz.staticFoo = 3',
      errors: [reassignmentError],
    },
    {
      code: 'function foo() {}; foo.metadata = {}',
      errors: [reassignmentError],
    },
    {
      code: 'function Clazz() { }; Clazz.prototype.foo = function() {}',
      errors: [prototypesError],
    },
    {
      code: 'a = 2;',
      errors: [reassignmentError],
    },
    {
      code: 'a += 2;',
      errors: [reassignmentError],
    },
    {
      code: 'a -= 2;',
      errors: [reassignmentError],
    },
    {
      code: 'a *= 2;',
      errors: [reassignmentError],
    },
    {
      code: 'a /= 2;',
      errors: [reassignmentError],
    },
    {
      code: 'a %= 2;',
      errors: [reassignmentError],
    },
    {
      code: 'a++;',
      errors: [incrementError],
    },
    {
      code: '++a;',
      errors: [incrementError],
    },
    {
      code: 'a--;',
      errors: [decrementError],
    },
    {
      code: '--a;',
      errors: [decrementError],
    },
    {
      code: 'for(let i = 0; ++i < 3; ){}',
      options: [{allowUnaryOperatorInForLoops: true}],
      errors: [incrementError],
    },
    {
      code: 'for(let i = 0; i++ < 3; ){}',
      options: [{allowUnaryOperatorInForLoops: true}],
      errors: [incrementError],
    },
    {
      code: 'for(let i = 3; --i > 0; ){}',
      options: [{allowUnaryOperatorInForLoops: true}],
      errors: [decrementError],
    },
    {
      code: 'for(let i = 3; i-- > 0; ){}',
      options: [{allowUnaryOperatorInForLoops: true}],
      errors: [decrementError],
    },
    {
      code: 'function foo(a) { a = a || {}; }',
      errors: [reassignmentError],
    },
    {
      code: 'module.foo = {};',
      errors: [reassignmentError],
    },
    {
      code: 'foo.exports = {};',
      errors: [reassignmentError],
    },
    {
      code: 'exports = {};',
      errors: [commonJsError],
    },
    {
      code: 'exports.foo = {};',
      errors: [commonJsError],
    },
    {
      code: 'exports.foo.bar = {};',
      errors: [commonJsError],
    },
    {
      code: 'exports[foo] = {};',
      errors: [commonJsError],
    },
    {
      code: 'exports.foo[bar] = {};',
      errors: [commonJsError],
    },
    {
      code: 'exports[foo].bar = {};',
      errors: [commonJsError],
    },
    {
      code: 'module.exports = {};',
      errors: [commonJsError],
    },
    {
      code: 'module.exports.foo = {};',
      errors: [commonJsError],
    },
    {
      code: 'module.exports[foo] = {};',
      errors: [commonJsError],
    },
    {
      code: 'module.exports.foo[bar] = {};',
      errors: [commonJsError],
    },
    {
      code: 'module.exports[foo].bar = {};',
      errors: [commonJsError],
    },
    {
      code: 'foo.bar = {};',
      options: [{exceptions: [
        {object: 'foo', property: 'boo'},
      ]}],
      errors: [reassignmentError],
    },
    {
      code: 'baz.propTypes = {};',
      options: [{exceptions: [
        {object: 'foo'},
      ]}],
      errors: [reassignmentError],
    },
    {
      code: 'baz.propTypes = {};',
      options: [{exceptions: [
        {property: 'props'},
      ]}],
      errors: [reassignmentError],
    },
    {
      code: 'baz.propTypes = {};',
      options: [{exceptions: [{}]}],
      errors: [reassignmentError],
    },
    {
      code: 'this.foo = 100;',
      errors: [reassignmentError],
    },
    {
      code: 'this.foo.bar = 100;',
      errors: [reassignmentError],
    },
    {
      code: 'function bar() { this.foo = 100; }',
      errors: [reassignmentError],
    },
    {
      code: 'let a = 1; function bar() { a = 2; }',
      errors: [reassignmentError],
    },
    {
      code: 'a[0] = 2;',
      errors: [reassignmentError],
    },
    {
      code: 'o["name"] = 2;',
      errors: [reassignmentError],
    },
    {
      code: 'const a = new Object(x); a[0] = 2;', // One of the many gotchas of javasript is that new Object doesnt allocate new space in memory, and does not shallow copy
      errors: [reassignmentError],
    },
    {
      code: '_.reduce((acc, x) => { acc[2] = 1; return acc; }, [], [1,2,3])',
      options: [{reducers: []}],
      errors: [reassignmentError],
    },
    {
      code: 'let a, b; b += 2;',
      errors: [reassignmentError],
    },
  ],
});
