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
    'no-console': 'off',
    'no-trailing-spaces': 'off',
    'eol-last': 'off',
    'comma-dangle': 'off',
    quotes: 'off',
    semi: 'off',
    indent: 'off',
    'react/react-in-jsx-scope': 'off',
  },
  overrides: [
    {
      files: ['frontend/**/*.{js,jsx}'],
      env: {
        browser: true,
        es6: true,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    {
      files: ['backend/**/*.js'],
      env: {
        node: true,
        jest: true,
      },
    },
    {
      files: ['cypress/**/*.js', 'cypress/**/*.cy.js'],
      env: {
        'cypress/globals': true,
      },
      plugins: ['cypress'],
      extends: ['plugin:cypress/recommended'],
      rules: {
        'cypress/no-unnecessary-waiting': 'off',
      },
    },
  ],
};
