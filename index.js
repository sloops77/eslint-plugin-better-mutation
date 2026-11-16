'use strict';

const packageJson = require('./package.json');
const noMutatingFunctions = require('./rules/no-mutating-functions');
const noMutatingMethods = require('./rules/no-mutating-methods');
const noMutation = require('./rules/no-mutation');
const defaults = require('./rules/utils/defaults');

const rules = {
  'no-mutating-functions': noMutatingFunctions,
  'no-mutating-methods': noMutatingMethods,
  'no-mutation': noMutation,
};

const externalRecommendedRules = {
  'no-var': 'error',
};

const internalRecommendedRules = Object.fromEntries(Object.entries(rules)
  .map(([name, rule]) => [`better-mutation/${name}`, rule.meta.docs.recommended]));

const plugin = {
  meta: {
    name: packageJson.name,
    version: packageJson.version,
  },
  configs: {},
  rules,
  processors: {},
  defaults,
};

Object.assign(plugin.configs, {
  'flat/recommended': [{
    plugins: {
      'better-mutation': plugin,
    },
    rules: {...internalRecommendedRules, ...externalRecommendedRules},
  }],
  recommended: {
    root: false, // Hack to get this configuration seen as legacy plugin
    plugins: ['better-mutation'],
    rules: {...internalRecommendedRules, ...externalRecommendedRules},
  },
});

module.exports.default = plugin;

module.exports = plugin;
