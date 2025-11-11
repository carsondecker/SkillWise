module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:cypress/recommended', // ✅ enable Cypress globals
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // ⚙️ General flexibility
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'no-trailing-spaces': 'off',
    'eol-last': 'off',
    'comma-dangle': 'off',
    quotes: 'off',
    semi: 'off',
    indent: 'off',

    // ✅ React compatibility (no need to import React in JSX)
    'react/react-in-jsx-scope': 'off',
  },
  overrides: [
    // ✅ Frontend (React)
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
    // ✅ Cypress E2E tests
    {
      files: ['cypress/**/*.cy.{js,jsx,ts,tsx}'],
      env: {
        'cypress/globals': true,
      },
      rules: {
        'cypress/no-unnecessary-waiting': 'warn', // not hard fail
      },
    },
    // ✅ Backend (Node + Jest)
    {
      files: ['backend/**/*.js', 'tests/**/*.js'],
      env: {
        node: true,
        jest: true,
      },
    },
  ],
};
