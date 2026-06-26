# @camunda8/hub-api-client

A typed TypeScript client for the **Camunda Hub public API v2**.

Generated from the Camunda Hub public API v2 OpenAPI contract, so request,
response, and model types always match the published spec. Built on
[`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/) for a small, typed
`fetch` client.

## Installation

```bash
npm install @camunda8/hub-api-client
```

## Usage

Create a client with the API base URL (including the `/api/v2` segment) and a
bearer token, then call endpoints by path and method. Request bodies, query
parameters, path parameters, and responses are all fully typed from the spec.

```ts
import { createHubPublicApiClient } from '@camunda8/hub-api-client';

const client = createHubPublicApiClient({
  baseUrl: 'https://modeler.camunda.io/api/v2',
  // A static token, or a (possibly async) function returning a fresh one.
  token: async () => fetchAccessToken()
});

// Typed path + body. `data` is the typed response, `error` the typed problem detail.
const { data, error } = await client.POST('/projects', {
  body: { name: 'My project', workspaceKey: 'my-workspace-key' }
});

if (error) {
  throw new Error(`Request failed: ${error.detail}`);
}

console.log(data.projectKey);

// Path parameters are typed too. Every call returns `{ data, error }`.
const { data: project } = await client.GET('/projects/{projectKey}', {
  params: { path: { projectKey: data.projectKey } }
});
```

### Authentication

`token` may be a string or a function returning a string (sync or async). When
provided, an `Authorization: Bearer <token>` header is attached to every
request. The function form is resolved on each request, so it can return a
freshly refreshed token. Omit `token` to handle authentication yourself (e.g.
via a custom `fetch` or default `headers`, both forwarded to `openapi-fetch`).

### Using the model types

The generated models are exported for reuse in your own code:

```ts
import type { Schemas } from '@camunda8/hub-api-client';

type Project = Schemas['ProjectResult'];
```

The lower-level `paths`, `operations`, and `components` types are also exported
for advanced use cases.

## Contributing

The client is generated from the Camunda Hub public API v2 OpenAPI spec and is
not committed. See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to fetch the
spec, regenerate, and publish.
