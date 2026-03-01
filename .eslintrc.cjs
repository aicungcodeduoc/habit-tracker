/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['expo'],
  ignorePatterns: ['node_modules/', 'supabase/types.ts', '*.config.js', '*.config.cjs'],
  env: { node: true, es2022: true },
};
