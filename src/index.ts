/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH under
 * one or more contributor license agreements. See the NOTICE file distributed
 * with this work for additional information regarding copyright ownership.
 * Licensed under the Camunda License 1.0. You may not use this file
 * except in compliance with the Camunda License 1.0.
 */

export {
  createHubApiClient,
  type HubApiClient,
  type CreateHubApiClientOptions,
  type BearerTokenProvider
} from './client.js';

export type {
  paths,
  components,
  operations,
  webhooks
} from './generated/schema.js';

import type { components } from './generated/schema.js';

/**
 * Convenience alias for the API's model types, e.g. `Schemas['ProjectResult']`.
 */
export type Schemas = components['schemas'];
