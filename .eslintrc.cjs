module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  settings: { react: { version: 'detect' } },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': 'error',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'import/order': ['warn', { 'newlines-between': 'always', alphabetize: { order: 'asc' } }],
  },
  overrides: [
    {
      // 使用 @ts-nocheck 的遗留文件,留给后续 PR 处理
      files: [
        'src/shared/contexts/GrowthContext.tsx',
        'src/features/growth-tree/components/TreeVisualization.tsx',
        'src/features/growth-tree/pages/GrowthTreePage.tsx',
      ],
      rules: { '@typescript-eslint/ban-ts-comment': 'off' },
    },
    {
      // Analytics 整体重构较大,留 PR3 处理
      files: ['src/features/analytics/pages/AnalyticsPage.tsx'],
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'react/no-unescaped-entities': 'off',
      },
    },
    {
      // 测试文件中 mock 和类型断言使用 any 是合理的;同时支持 __tests__ 目录和 features 下嵌套 __tests__
      files: ['src/__tests__/**/*.{ts,tsx}', 'src/features/**/__tests__/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'react/prop-types': 'off',
        'no-undef': 'off',
      },
    },
  ],
  ignorePatterns: ['dist', 'node_modules', 'coverage', '*.cjs', '*.config.*'],
};
