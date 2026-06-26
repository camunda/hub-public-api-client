# Contributing — `@camunda8/hub-public-api-client`

## How the client is generated

The client is generated from the **public API v2 OpenAPI spec**, which lives in
the (private) `camunda/camunda-hub` repository at
`restapi/public-api/src/main/resources/openapi/v2/`. The spec is **not** part of
this repo and is **not** committed here — it is fetched at build time, and the
generated client (`src/generated/schema.ts`) is a gitignored build artifact.

- In CI, the [`fetch-spec`](.github/actions/fetch-spec/action.yml) composite
  action does a read-only, shallow + sparse checkout of just the spec (via a
  read-only deploy key).
- Locally, `npm run fetch-spec` does the same using your own GitHub credentials.

Both place the spec under `.spec-src/`. `npm run generate` then reads it
(override the location with `HUB_SPEC_DIR`). `tsc`/`build` regenerate first, so
you don't normally run `generate` by hand.

> **Do not edit `src/generated/schema.ts` by hand.** Change the spec in
> `camunda-hub` and regenerate.

## Local development

```bash
npm ci
npm run fetch-spec     # sparse-clones the spec into .spec-src (needs read access to camunda-hub)
npm run build          # clean -> generate -> tsc (emit dist/); or `npm run tsc` to type-check only
npm run lint
```

`.spec-src/` and `src/generated/` are gitignored.

## Scripts

| Script              | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| `npm run fetch-spec`| Sparse-clone the spec from `camunda-hub` into `.spec-src`. |
| `npm run generate`  | Generate `src/generated/schema.ts` from the fetched spec.  |
| `npm run build`     | Clean, regenerate, then emit JS + declarations to `dist/`. |
| `npm run tsc`       | Regenerate, then type-check without emitting.              |
| `npm run lint`      | Lint the hand-written source.                              |
| `npm run clean`     | Remove `dist/` and `src/generated/`.                       |

## External contributions (fork limitation)

Fork pull requests **cannot** run the spec-dependent CI: GitHub withholds repo
secrets (the deploy key) from fork PRs, so the spec can't be fetched. The
`check` workflow is skipped on fork PRs (a `check-skip` job keeps the required
status green). A maintainer validates external changes by re-running them on a
branch in this repo, where the spec fetch and full CI run.

## CI & access

- The spec is fetched with a **read-only SSH deploy key**: generate a keypair,
  add the **public** key to `camunda-hub` (Settings → Deploy keys, **without**
  write access), and store the **private** key as the `HUB_SPEC_DEPLOY_KEY`
  secret in this repo. A deploy key is scoped to that one repo and is not tied
  to a user account. Rotate it periodically.
  - Alternative: a fine-grained **PAT** (Contents: read on `camunda-hub`,
    ideally on a service account) passed to checkout via `token:` instead of
    `ssh-key:`. Simpler, but user-bound and expires ≤1 year.
- `check.yml` runs on PRs/push/schedule; the scheduled run catches an upstream
  spec change that breaks the client before a release does.

## Publishing

`publish.yml` publishes to npm via **OIDC trusted publishing** (no npm token) on
a published GitHub Release (or manual dispatch). It fetches the spec at a pinned
ref, then `npm publish` runs `prepack` -> `build`, so the tarball is built from
that exact spec commit. Provenance is emitted automatically (public repo +
package).

### One-time setup (needs `@camunda8` npm-org admin)

1. **Bootstrap** — a trusted publisher attaches to a package that exists, so
   publish `0.1.0` once (after `npm run fetch-spec`):

   ```bash
   npm run fetch-spec
   npm login                 # account with publish rights to @camunda8
   npm publish
   ```

2. **Configure the trusted publisher** on npmjs.com — package
   **Settings → Trusted Publisher → GitHub Actions**: organization `camunda`,
   repository `hub-public-api-client`, workflow `publish.yml`, allowed action
   `npm publish`.

### Releasing

Bump `version`, commit, and cut a GitHub Release (the first CI release must be
`> 0.1.0`). The workflow publishes over OIDC with provenance — no tokens.
