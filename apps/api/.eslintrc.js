module.exports = {
  root: true,
  env: { node: true },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'NewExpression[callee.name="Date"][arguments.length=0]',
        message: 'Do not use new Date() directly to get the current time. Use utcNow() from src/utils/time to ensure UTC consistency.',
      },
      {
        selector: 'CallExpression[callee.object.name="Date"][callee.property.name="now"]',
        message: 'Do not use Date.now() directly. Use utcNow().getTime() to ensure UTC consistency.',
      }
    ],
  },
};
