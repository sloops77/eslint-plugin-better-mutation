'use strict';

const importModules = require('import-modules');
const createIndex = require('create-eslint-index');
const defaults = require('./rules/utils/defaults');

const rules = importModules('rules', {camelize: false});

const externalRecommendedRules = {
  'no-var': 'error',
};

const internalRecommendedRules = createIndex.createConfig({
  plugin: 'better-mutation',
  field: 'meta.docs.recommended',
}, rules);

module.exports = {
  rules,
  configs: {
    recommended: {
      rules: {...internalRecommendedRules, ...externalRecommendedRules},
    },
  },
  defaults,
};
