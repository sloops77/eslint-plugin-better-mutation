# Forbid the use of mutating operators

If you want to program as if your variables are immutable, part of the answer is to not mutation by re-assigning to a variable or assigning to a property, and not use update operators like `++` or `--`.

## Options

This rule supports the following options:

`commonjs`: If set to `true`, then this rule will not report when assigning to or to a (sub-) property of `exports` or `module.exports`. Note that this will not report when reassigning or overwriting previous exports.

`allowThis`: If set to `true`, then this rule will not report when assigning to or to a (sub-) property of `this`.

`exceptions`: List of objects that describe exceptions to the rule. Each exception should have either or both `object` and `property` field set.

`prototypes`: If set to `true`, then this rule will permit assignment to the `prototype` of an object.

`reducers`: An array of method or function names that are like a reducer and therefore modification of the first parameter is will not error. 
The default value is `["reduce"]` 

`intializers`: An array of callees that are creating new values by allocating new memory. The result of calling these initializers may be modified within the block scope. The default value is `['Array.from',
"Array.fromAsync",
"Array.of",
"Map.groupBy",
"Object.create",
"Object.entries",
"Object.fromEntries",
"Object.getOwnPropertyNames",
"Object.getOwnPropertySymbols",
"Object.groupBy",
"Object.keys",
"Object.values",
"structuredClone"]` 

You can set the options like this:

```js
const { rules: { ["no-mutation"]: { defaults: { defaultReducers, defaultInitializers } } } } = require('eslint-better-mutation');

module.exports = {
  "eslintConfig": {
      "rules": {
          "better-migration/no-mutation": ["error", {
            "commonjs": true,
            "allowThis": true,
            "exceptions": [
              {"object": "foo", "property": "bar"}
            ],
            "reducers": [
              ...defaultReducers, 
              "fold", 
              "foldLeft", 
              "foldRight"
            ],
            "initializers": [
              ...defaultInitializers,
              "MyObject.init"
            ]
          }]   
      }
  }
}
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

/* eslint better-migration/no-mutation: ["error", {"reducers": [...defaultReducers, "fold"}] */
const sum = fold((acc, num) => acc += num, 0, [1, 2, 3]);

/* eslint better-migration/no-mutation: ["error", {"initializers": [...defaultInitializers, "MyObject.init"}] */
const x = MyObject.init(42);
x.foo = "bar"
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

const sum = foldRight((acc, num) => acc += num, 0, [1, 2, 3]);

const x = Initializer.init(88);
x.foo = "bar"

```

