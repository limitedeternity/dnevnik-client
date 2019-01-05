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
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "indent": ["error", 2],
    "semi": ["error", "always"]
  },
  parserOptions: {
    parser: "babel-eslint"
  }
};
