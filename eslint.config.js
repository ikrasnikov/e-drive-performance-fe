import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import noUnsanitized from 'eslint-plugin-no-unsanitized';
import security from 'eslint-plugin-security';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/', 'dist/', '.*/'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
    plugins: {
      'no-unsanitized': noUnsanitized,
      security,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'array-callback-return': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      complexity: ['error', 20],
      curly: ['error', 'multi-line'],
      'default-case-last': 'error',
      'default-param-last': 'error',
      eqeqeq: ['error', 'always'],
      'max-classes-per-file': ['error', 3],
      'max-depth': ['error', 2],
      'max-len': [
        'error',
        {
          code: 120,
          ignoreComments: true,
          ignoreRegExpLiterals: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreTrailingComments: true,
        },
      ],
      'max-lines': ['error', 550],
      'no-alert': 'error',
      'no-bitwise': 'error',
      'no-caller': 'error',
      'no-console': [
        'error',
        {
          allow: [
            'warn',
            'dir',
            'timeLog',
            'assert',
            'clear',
            'count',
            'countReset',
            'group',
            'groupEnd',
            'table',
            'dirxml',
            'error',
            'groupCollapsed',
            'timeStamp',
          ],
        },
      ],
      'no-constant-binary-expression': 'error',
      'no-constructor-return': 'error',
      'no-div-regex': 'error',
      'no-else-return': 'error',
      'no-empty-function': ['error', { allow: ['arrowFunctions', 'methods'] }],
      'no-eval': 'error',
      'no-implicit-coercion': 'warn',
      'no-implied-eval': 'error',
      'no-invalid-this': 'error',
      'no-loop-func': 'error',
      'no-magic-numbers': [
        'error',
        { ignore: [-1, 0, 1, 2], ignoreArrayIndexes: true, ignoreClassFieldInitialValues: true },
      ],
      'no-multi-assign': 'error',
      'no-multi-str': 'error',
      'no-new-wrappers': 'error',
      'no-promise-executor-return': 'error',
      'no-restricted-exports': ['error', { restrictDefaultExports: { direct: true } }],
      'no-return-assign': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-shadow': ['error', { hoist: 'all' }],
      'no-template-curly-in-string': 'error',
      'no-undef-init': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unneeded-ternary': 'error',
      'no-unreachable-loop': 'error',
      'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
      'no-unused-private-class-members': 'error',
      'no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          vars: 'all',
        },
      ],
      'no-use-before-define': ['error', { functions: false }],
      'no-useless-computed-key': 'error',
      'no-useless-concat': 'error',
      'no-useless-constructor': 'error',
      'no-useless-escape': 'off',
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-const': 'error',
      'prefer-object-has-own': 'error',
      'prefer-template': 'error',
      yoda: 'error',

      'no-unsanitized/method': 'warn',
      'no-unsanitized/property': 'warn',
      'security/detect-eval-with-expression': 'error',

      // Group order follows mono's import-sort-style-studytube:
      // packages, side-effect imports, env/config/routes, local imports
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^@?\\w'],
            ['^\\u0000'],
            ['(@env|/env|/environment|/config|-routes|/routes)(\\.js)?$'],
            ['^\\.'],
          ],
        },
      ],
    },
  },
  {
    files: ['*.config.{js,mjs,cjs}'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-magic-numbers': 'off',
      'no-restricted-exports': 'off',
    },
  },
  prettier,
];
