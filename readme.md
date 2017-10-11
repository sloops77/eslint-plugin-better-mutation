# eslint-plugin-better-migration [![CircleCI](https://circleci.com/gh/sloops77/eslint-plugin-better-mutation.svg?style=svg)](https://circleci.com/gh/sloops77/eslint-plugin-better-mutation)

ESLint rules for better mutation rules

## Install

```
$ npm install --save-dev eslint eslint-plugin-better-mutation
```

## Usage

Configure it in `package.json`.

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

To enable this configuration, use the `extends` property in your `package.json`.

```json
{
  "name": "my-awesome-project",
  "eslintConfig": {
    "plugins": [
      "better-migration"
    ],
    "extends": "plugin:better-migration/recommended"
  }
}
```

See [ESLint documentation](http://eslint.org/docs/user-guide/configuring#extending-configuration-files) for more information about extending configuration files.

MIT © [Andres Olave](https://github.com/sloops77)

Thanks to [Jeroen Engels](https://github.com/jfmengels). Checkout https://github.com/jfmengels/eslint-plugin-fp for a real functional programming eslint
