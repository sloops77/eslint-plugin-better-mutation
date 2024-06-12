# eslint-plugin-better-mutation 
[![CircleCI](https://circleci.com/gh/sloops77/eslint-plugin-better-mutation.svg?style=svg)](https://circleci.com/gh/sloops77/eslint-plugin-better-mutation)
[![codecov](https://codecov.io/gh/sloops77/eslint-plugin-better-mutation/branch/master/graph/badge.svg)](https://codecov.io/gh/sloops77/eslint-plugin-better-mutation)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)

ESLint rules so you and your team use immutable values when you should, and permits mutation when it's safe.

Preventing unsafe mutation of **shared** variables prevents a huge class of bugs from ever appearing.

The plugin's goal is to prevent modification of **shared** variables, such as function parameters or globals whether via assignment, operators, functions or methods. 

Locally declared variables are permitted to use mutation, because in most circumstances this is safe.

See [WHY.](why.md)



## What's not safe?
Mutating variables of **shared** variables is unsafe. This means reassignment outside of the scope they are declared within whether its because they are globals, function parameters, or closed over variables can lead to undefined behaviour that is hard to debug and can cause race conditions. Instead of mutating always return a new value.

```
g = 2 // global reassignment is unsafe

function foo(i) {
   i += 1 // don't resassign function parameters
}

let a = 1; 
function bar() { 
   a = 2; // don't reassign closed over vars
}
```

## What's safe?
Block scoped (`let`) or function scoped variables (`var`) can be reassigned safely. 

```
function foo() {
  let i = 1; 
  i = 2;
}
```

Even objects or arrays marked with `const` can have nested properties changed within the block scope they belong to. The same rules apply for mutating functions (e.g. `Object.assign()` and mutating methods `[].push()`
```
function foo() {
  const o = { a: 0 };
  o.a += 1;
}
```

Common js uses assignment and is supported via a special case
```
module.exports = { foo }; // by default commonjs exports are configured to be safe
```

Variables created using constructors such as the Array constructor are safe to modify. However the Object constructor is not safe  because it returns the reference if its an object)
```
const myObject = new MyObject();
myObject.foo = 'bar'

const array = new Array(1, 2, 3);
array[2] += 1;

const o = new Object({1,2});
o.foo = 'bar' // error
```

Variables created using static initializers such as the Array constructor, `Array.from` or `Array.of` are also safe to modify. 
```
const array = Array.of(1,2,3)
array[2] += 1;
```

Similarly for Objects there are a few static initializers that are safe.
```
const o = Object.create({1,2,3})
o.foo = 'bar' // safe
```

Changing an array created using an instance method such as map is not permitted. Most JS developers would never do this!
If you would like it track the open issue at https://github.com/sloops77/eslint-plugin-better-mutation/issues
```
const x = array.map(i => i + 1);
x[2] += 1;  // error
```

Reducer functions/methods are a special case and may modify the `accumulator` parameter because 
the loop that the reducer executes limits the scope of the accumulator to the reducer function. 

``` 
function sum(numbers) {
  return numbers.reduce((acc, val) => {
    acc += val;  // this is safe!
    return acc;    
  }, 0);
}

``` 

## Currently unsupported

- lodash fp

## Install

```
$ npm install --save-dev eslint eslint-plugin-better-mutation
```

## Usage

Configure it in `.eslintrc`.

<!-- EXAMPLE_CONFIGURATION:START -->
```json
{
  "name": "my-awesome-project",
  "eslintConfig": {
    "env": {
      "es6": true
    },
    "plugins": [
      "better-mutation"
    ],
    "rules": {
      "better-mutation/no-mutating-functions": "error",
      "better-mutation/no-mutating-methods": "error",
      "better-mutation/no-mutation": "error"
    }
  }
}
```
<!-- EXAMPLE_CONFIGURATION:END -->

## Rules

<!-- RULES:START -->
- [no-mutation](docs/rules/no-mutation.md) - Forbid the use of mutating operators on non-local variables.
- [no-mutating-methods](docs/rules/no-mutating-methods.md) - Forbid the use of mutating methods on non-local variables such as push or _.remove.
- [no-mutating-functions](docs/rules/no-mutating-functions.md) - Forbid the use of [`Object.assign() and lodash mutation methods`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign) with a non-local variable as first argument.

<!-- RULES:END -->

## Recommended configuration

This plugin exports a [`recommended` configuration](index.js) that enforces good practices.

To enable this configuration, use the `extends` property in your `.eslintrc`.

```json
{
  "name": "my-awesome-project",
  "eslintConfig": {
    "plugins": [
      "better-mutation"
    ],
    "extends": "plugin:better-mutation/recommended"
  }
}
```

See [ESLint documentation](http://eslint.org/docs/user-guide/configuring#extending-configuration-files) for more information about extending configuration files.

MIT © [Andres Olave](https://github.com/sloops77)

Thanks to [Jeroen Engels](https://github.com/jfmengels) for providing the basis of this plugin. Checkout https://github.com/jfmengels/eslint-plugin-fp for a strict functional programming approach.
