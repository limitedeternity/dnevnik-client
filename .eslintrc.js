module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es6: true
  },
  extends: ["plugin:vue/essential", "eslint:recommended"],
  plugins: ["html"],
  rules: {
    indent: ["error", 2, { SwitchCase: 1 }],
    semi: ["error", "always"],
    quotes: ["error", "double"],
    "no-console": "off"
  },
  parserOptions: {
    parser: "babel-eslint"
  }
};
