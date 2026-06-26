/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH under
 * one or more contributor license agreements. See the NOTICE file distributed
 * with this work for additional information regarding copyright ownership.
 * Licensed under the Camunda License 1.0. You may not use this file
 * except in compliance with the Camunda License 1.0.
 */

import createClient from 'openapi-fetch';
import type { Client, ClientOptions } from 'openapi-fetch';

import type { paths } from './generated/schema.js';

/**
 * A fully typed client for the Camunda Hub public API v2. Endpoints are called
 * by path and method, e.g. `client.GET('/projects/{projectKey}', ...)`, with
 * request and response types inferred from the OpenAPI spec.
 */
export type HubPublicApiClient = Client<paths>;

/**
 * A bearer token, or a (possibly async) function returning one. The function
 * form is resolved on every request, so it can return a freshly refreshed
 * token.
 */
export type BearerTokenProvider =
  | string
  | (() => string | undefined | Promise<string | undefined>);

export interface CreateHubPublicApiClientOptions extends ClientOptions {
  /**
   * Base URL of the API, including the `/api/v2` path segment, e.g.
   * `https://modeler.camunda.io/api/v2`.
   */
  baseUrl: string;
  /**
   * Bearer token (JWT) used to authenticate requests. When provided, an
   * `Authorization: Bearer <token>` header is attached to every request.
   */
  token?: BearerTokenProvider;
}

/**
 * Creates a typed client for the Camunda Hub public API v2.
 *
 * @param options - Client configuration. `baseUrl` is required; `token`
 *   enables bearer authentication. Any other `openapi-fetch` option (e.g. a
 *   custom `fetch` or default `headers`) is forwarded.
 * @returns A typed client exposing one method per HTTP verb.
 */
export function createHubPublicApiClient(
  options: CreateHubPublicApiClientOptions
): HubPublicApiClient {
  const { token, ...clientOptions } = options;
  const client = createClient<paths>(clientOptions);

  if (token !== undefined) {
    client.use({
      async onRequest({ request }) {
        const value = typeof token === 'function' ? await token() : token;
        if (value) {
          request.headers.set('Authorization', `Bearer ${value}`);
        }
        return request;
      }
    });
  }

  return client;
}
