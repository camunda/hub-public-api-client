/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH under
 * one or more contributor license agreements. See the NOTICE file distributed
 * with this work for additional information regarding copyright ownership.
 * Licensed under the Camunda License 1.0. You may not use this file
 * except in compliance with the Camunda License 1.0.
 */

import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import pluginLicenseHeader from 'eslint-plugin-license-header';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  {
    // `src/generated` is auto-generated (and self-disables linting); build
    // output and the fetched spec checkout are not linted.
    ignores: ['dist/**', 'src/generated/**', '.spec-src/**']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  pluginPrettierRecommended,
  {
    files: ['**/*.ts'],
    plugins: {
      'license-header': pluginLicenseHeader
    },
    languageOptions: {
      globals: {
        ...globals.node
      }
    },
    rules: {
      'license-header/header': ['error', resolve(__dirname, 'license.header')],
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    }
  }
];
