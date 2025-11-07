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
    // 🚦 General leniency
    'no-unused-vars': 'warn', // Warn instead of error
    'no-console': 'off', // Allow console logs for debugging
    'no-trailing-spaces': 'off', // Don't block trailing spaces
    'eol-last': 'off', // No strict newline at EOF
    'comma-dangle': 'off', // Allow optional trailing commas
    quotes: 'off', // Allow both single/double quotes
    semi: 'off', // Don't enforce semicolons
    indent: 'off', // Don't enforce indentation

    // ✅ Optional: ignore React 17+ JSX import rule
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
  ],
};
