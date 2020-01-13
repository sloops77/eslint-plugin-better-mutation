# eslint-plugin-better-mutation 
[![CircleCI](https://circleci.com/gh/sloops77/eslint-plugin-better-mutation.svg?style=svg)](https://circleci.com/gh/sloops77/eslint-plugin-better-mutation)
[![codecov](https://codecov.io/gh/sloops77/eslint-plugin-better-mutation/branch/master/graph/badge.svg)](https://codecov.io/gh/sloops77/eslint-plugin-better-mutation)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)

ESLint rules so you and your team obey the rules of better mutation

## The why?

You know that immutability is preferable, but actually some mutation is totally safe.

Functional languages like clojure offer atomics to offer controlled mutation

The problem is you are using javascript so how do you make sure you and your team follow 
the rules. You want to enforce immutability by default, but permit safe mutation. 

This is what eslint plugin was created for.

It ensures that variables from outside of your scope such as function parameters or 
globals are never modified using operators, assignment, mutating collection calls
and includes support for lodash. And if you are promoting the use of Ramda or lodash/fp you can add exemptions for 
these libraries 

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
      "better-mutation/no-mutation": "error",
    }
  }
}
```
<!-- EXAMPLE_CONFIGURATION:END -->


## Rules

<!-- RULES:START -->
- [no-mutating-functions](docs/rules/no-mutating-functions.md) - Forbid the use of [`Object.assign() and lodash mutation methods`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign) with a non-local variable as first argument.
- [no-mutating-methods](docs/rules/no-mutating-methods.md) - Forbid the use of mutating methods on non-local variables.
- [no-mutation](docs/rules/no-mutation.md) - Forbid the use of mutating operators on non-local variables.

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

Thanks to [Jeroen Engels](https://github.com/jfmengels). Checkout https://github.com/jfmengels/eslint-plugin-fp for a real functional programming eslint
