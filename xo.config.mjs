import eslintPluginModule from 'eslint-plugin-eslint-plugin';
import nModule from 'eslint-plugin-n';

const eslintPlugin = eslintPluginModule.default ?? eslintPluginModule;
const n = nModule.default ?? nModule;

const config = [
  eslintPlugin.configs['flat/recommended'] ?? eslintPlugin.configs.recommended,
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

export default config;
