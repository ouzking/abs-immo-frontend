import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // src/types/backend : copie conforme des contrats du dépôt abs-immo-backend (non modifiée ici).
  globalIgnores(['dist', 'coverage', 'src/types/backend']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['scripts/**/*.ts', 'vite.config.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    // Fichier de configuration des routes (déclare des composants paresseux) : pas concerné par le Fast Refresh.
    files: ['src/app/router.tsx', 'src/**/*.test.{ts,tsx}', 'src/test/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
