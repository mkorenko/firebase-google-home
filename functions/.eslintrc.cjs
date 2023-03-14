module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    'sourceType': 'module',
    'ecmaVersion': 'latest',
  },
  extends: [
    'eslint:recommended',
    'google',
  ],
  rules: {
    'no-restricted-globals': ['error', 'name', 'length'],
    'prefer-arrow-callback': 'error',
    'no-unused-vars': 0,
  },
  overrides: [
    {
      files: ['**/*.spec.*'],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
