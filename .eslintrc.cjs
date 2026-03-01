/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['expo'],
  ignorePatterns: ['node_modules/', 'supabase/types.ts', '*.config.js', '*.config.cjs'],
  env: { node: true, es2022: true },
  settings: {
    'import/ignore': ['expo-file-system/legacy', 'react-native'],
  },
  rules: {
    'import/no-unresolved': ['error', { ignore: ['^expo-file-system/legacy$', '^react-native$'] }],
    'import/namespace': 'off',
  },
};
