'use strict';

const importModules = require('import-modules');
const createIndex = require('create-eslint-index');
const packageJson = require('./package.json');
const defaults = require('./rules/utils/defaults');

const rules = importModules('rules', {camelize: false});

const externalRecommendedRules = {
  'no-var': 'error',
};

const internalRecommendedRules = createIndex.createConfig({
  plugin: 'better-mutation',
  field: 'meta.docs.recommended',
}, rules);

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
