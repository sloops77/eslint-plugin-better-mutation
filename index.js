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
    version: packageJson.version
  },
  rules,
  configs: {
    recommended: {
      rules: {...internalRecommendedRules, ...externalRecommendedRules},
    },
  },
  defaults,
};

module.exports = plugin;
