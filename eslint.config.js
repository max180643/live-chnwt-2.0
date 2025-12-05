import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import { defineConfig } from 'vite';

export default defineConfig([
  {
    ignores: [
      'vitest.config.ts',
      'vite.config.ts',
      '**/*.d.ts',
      '**/*.config.ts',
      'node_modules/**',
      'dist/**',
      'coverage/**',
    ],
  },
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...eslintPluginPrettier.configs.recommended.rules,
      'prettier/prettier': ['error', {}, { usePrettierrc: true }],
      'no-unused-vars': 'off',
    },
  },
  pluginVue.configs['flat/recommended'],
]);
