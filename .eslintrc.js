module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es6: true
  },
  extends: ['plugin:vue/essential', 'eslint:recommended'],
  plugins: ['html'],
  rules: {
    'indent': ['error', 2],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single']
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
};
