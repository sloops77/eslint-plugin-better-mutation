# Forbid the use of mutating methods

If you want to program as if your variables are immutable, you should not use mutating methods of core JavaScript objects, such as `Array.prototype.push`. Due to the lack of static information in JavaScript, it is not possible to know whether a method of an object is indeed the mutating core method or a function with the same name. Therefore, this rule simply reports the use of methods with the following names: `copyWithin`, `pop`, `push`, `reverse`, `shift`, `sort`, `splice`, `unshift`.

It will also report the use of `Object.defineProperties`, `Object.defineProperty`, `Object.setPrototypeOf`.

## Options

This rule supports the following options:

`allowedObjects`: Array of names of objects whose methods can be used with no restrictions. This can be useful when using libraries like [`lodash/fp`](https://github.com/lodash/lodash/wiki/FP-Guide) or [`Ramda`](http://ramdajs.com), whose methods will not mutate the arguments. Defaults to an empty array.
If set to `true`, then this rule will not report when assigning to or to a (sub-) property of `exports` or `module.exports`. Note that this will not report when reassigning or overwriting previous exports.

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
const { defaults: { defaultReducers, defaultInitializers } } = require('eslint-better-mutation');

module.exports = {
  "eslintConfig": {
    "rules": {
      "better-migration/no-mutating-methods": ["error", {
        "allowedObjects": ['_', 'R', 'fp'], 
        "reducers": [...defaultReducers, 'transform'],
        "initializers": [
          ...defaultInitializers,
          "MyObject.init"
        ]
      }]
    }
  }
}
```

### Fail

```js
probableArray.copyWithin(a);
probableArray.pop();
probableArray.push(value);
probableArray.reverse();
probableArray.shift();
probableArray.sort();
probableArray.splice(0, 1, value);
probableArray.unshift(value);
probableArray.unwatch();
probableArray.watch(fn);
```

### Pass

```js
probableArray.foo();
probableArray.concat(otherArray);

Object.keys(o);
Object.keys(o).sort();
Object.keys(o).sort().reverse();

/* eslint fp/no-mutating-methods: ["error", {"allowedObjects": ["_"]}] */
var _ = require('lodash/fp');
_.sort(a);
```
