# Forbid the use of mutating operators

If you want to program as if your variables are immutable, part of the answer is to not mutation by re-assigning to a variable or assigning to a property, and not use update operators like `++` or `--`.

## Options

This rule supports the following options:

`commonjs`: If set to `true`, then this rule will not report when assigning to or to a (sub-) property of `exports` or `module.exports`. Note that this will not report when reassigning or overwriting previous exports.

`allowThis`: If set to `true`, then this rule will not report when assigning to or to a (sub-) property of `this`.

`exceptions`: List of objects that describe exceptions to the rule. Each exception should have either or both `object` and `property` field set.

`reducers`: An array of method names that are reducer's that are exempt from the do not modify parameters rule for their first argument.

You can set the options like this:

```js
"better-migration/no-mutation": ["error", {
  "commonjs": true,
  "allowThis": true,
  "exceptions": [
    {"object": "foo", "property": "bar"}
  ]
}]
```

### Pass

```js
var a = 0;
let b = 1;
const c = 2;
let a = 1; a = 2;

function foo(a={}) {}

/* eslint better-migration/no-mutation: ["error", {"commonjs": true}] */
exports = {};
exports.foo = {};
module.exports = {};
module.exports.foo = {};

/* eslint better-migration/no-mutation: ["error", {"exceptions": [{"property": "propTypes"}]}] */
function Component(props) {
  // ...
}

Component.propTypes = {
  // ...
};

/* eslint better-migration/no-mutation: ["error", {"allowThis": true}] */
function foo(a) {
  this.a = a || {};
}
```

### Fail

```js
a = 0;

a += 10;
a -= 10;
a *= 10;
a /= 10;
a %= 10;

--a;
++a;
a--;
a++;

function foo(a) {
  a = a || {};
}

exports = {};
exports.foo = {};
module.exports = {};
module.exports.foo = {};

function foo(a) {
  this.a = a || {};
}

let a = 1; function bar() { a = 2; }
```

