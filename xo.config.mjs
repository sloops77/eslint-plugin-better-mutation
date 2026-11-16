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
      'n/prefer-process-get-builtin-module': 'off',
    },
  },
  {
    files: ['package.json'],
    rules: {
      // Moving to ESM or an `exports` map would be a breaking change for this CommonJS plugin.
      'package-json/prefer-type-module': 'off',
      'package-json/prefer-exports': 'off',
      // Renovate pins devDependencies to exact versions.
      'package-json/dependency-version-range': 'off',
    },
  },
];

export default config;
