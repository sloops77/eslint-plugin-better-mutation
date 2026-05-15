const eslintPlugin = require('eslint-plugin-eslint-plugin');
const n = require('eslint-plugin-n');

module.exports = [
  eslintPlugin.configs['flat/recommended'],
  {
    space: 2,
    rules: {
      ...n.configs.recommended.rules,
      'unicorn/prefer-module': 'off',
      'import-x/extensions': 'off',
      'eslint-plugin/require-meta-docs-description': 'error',
    },
  },
];
