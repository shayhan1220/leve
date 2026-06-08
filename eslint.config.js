const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  prettier,
  {
    ignores: ['dist/**', '.expo/**', 'supabase/functions/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'import/namespace': 'off',
      'import/no-unresolved': 'off',
      'import/no-duplicates': 'off',
    },
  },
]);
