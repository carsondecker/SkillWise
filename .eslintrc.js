module.exports = {
  env: {
    node: true,
    es2021: true,
    browser: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',
  },
  overrides: [
    {
      files: ['frontend/**/*.{js,jsx}'],
      extends: ['eslint:recommended'],
      env: {
        browser: true,
        es6: true,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        'no-unused-vars': 'warn',
        'no-console': 'warn',
        'comma-dangle': 'warn',
        'no-useless-escape': 'warn',
      },
    },
    {
      files: ['backend/**/*.js'],
      env: {
        node: true,
        jest: true,
      },
    },
  ],
};
