module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'script',
  },
  rules: {
    'strict': ['error', 'global'],
    'no-console': ['error', { allow: ['error', 'warn'] }],
    'no-underscore-dangle': 'off',
    'class-methods-use-this': 'off',
    'no-param-reassign': ['error', { props: false }],
    'max-len': ['error', { code: 120 }],
  },
}; 