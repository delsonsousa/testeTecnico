module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: {
    es2022: true,
    jest: true,
    node: true,
  },
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
  ignorePatterns: ['node_modules/', 'coverage/', '.expo/'],
};
