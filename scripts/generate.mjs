/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH under
 * one or more contributor license agreements. See the NOTICE file distributed
 * with this work for additional information regarding copyright ownership.
 * Licensed under the Camunda License 1.0. You may not use this file
 * except in compliance with the Camunda License 1.0.
 */

/**
 * Generates `src/generated/schema.ts` from the public API v2 OpenAPI spec.
 *
 * The spec is not part of this repository — it is fetched from the (private)
 * `camunda/camunda-hub` repo:
 *   - in CI, by the `.github/actions/fetch-spec` composite action;
 *   - locally, by `npm run fetch-spec`.
 * Both place the `openapi/v2` directory under `.spec-src/`. Override the
 * location with the `HUB_SPEC_DIR` environment variable.
 *
 * The multiple spec files are linked by `$ref`; openapi-typescript resolves them
 * via Redocly, so we only point it at the root document. The output is a build
 * artifact (gitignored), regenerated before `tsc`/`build`.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import openapiTS, { astToString } from 'openapi-typescript';

const specDir =
  process.env.HUB_SPEC_DIR ??
  resolve('.spec-src/restapi/public-api/src/main/resources/openapi/v2');
const specPath = resolve(specDir, 'rest-api.yaml');
const outputPath = resolve('src/generated/schema.ts');

const licenseHeader = `/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH under
 * one or more contributor license agreements. See the NOTICE file distributed
 * with this work for additional information regarding copyright ownership.
 * Licensed under the Camunda License 1.0. You may not use this file
 * except in compliance with the Camunda License 1.0.
 */`;

const banner = `${licenseHeader}

/* eslint-disable */
/**
 * This file is auto-generated from the public API v2 OpenAPI spec.
 *
 * Do NOT edit it by hand. Update the spec in the camunda-hub repository and run
 * \`npm run generate\` (after \`npm run fetch-spec\`).
 */
`;

const ast = await openapiTS(pathToFileURL(specPath), { alphabetize: true });

await mkdir(resolve('src/generated'), { recursive: true });
await writeFile(outputPath, `${banner}\n${astToString(ast)}`, 'utf8');

console.log(`Generated ${outputPath} from ${specPath}`);
