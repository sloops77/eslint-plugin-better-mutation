# eslint-plugin-better-mutation 
[![CircleCI](https://circleci.com/gh/sloops77/eslint-plugin-better-mutation.svg?style=svg)](https://circleci.com/gh/sloops77/eslint-plugin-better-mutation)
[![codecov](https://codecov.io/gh/sloops77/eslint-plugin-better-mutation/branch/master/graph/badge.svg)](https://codecov.io/gh/sloops77/eslint-plugin-better-mutation)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)

ESLint rules so you and your team use immutable values when you should, and permits mutation when it's safe.

Preventing mutation of shared variables prevents a huge class of bugs from ever appearing.

## What?

This eslint plugin sets rules for when to use immutable operations and when to permit mutation. 

It aims to prevent "borrowed" variables, such as function parameters or globals, from ever being modified using operators, assignment or mutating functions or methods. 

Locally declared variables are permitted to use mutation, because in most circumstances this is safe.

See [WHY.](why.md)

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
