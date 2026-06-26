# Contributing — `@camunda8/hub-api-client`

## How the client is generated

The client is generated from the **public API v2 OpenAPI spec**, which lives in
the (private) `camunda/camunda-hub` repository at
`restapi/public-api/src/main/resources/openapi/v2/`. The spec is **not** part of
this repo and is **not** committed here — it is fetched at build time, and the
generated client (`src/generated/schema.ts`) is a gitignored build artifact.

- In CI, the [`fetch-spec`](.github/actions/fetch-spec/action.yml) composite
  action does a read-only, shallow + sparse checkout of just the spec (via a
  GitHub App token).
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
secrets (the GitHub App credentials) from fork PRs, so the spec can't be
fetched. The
`check` workflow is skipped on fork PRs (a `check-skip` job keeps the required
status green). A maintainer validates external changes by re-running them on a
branch in this repo, where the spec fetch and full CI run.

## CI & access

- The spec is fetched with a **GitHub App** (`hub-public-api-spec-reader`) that
  has **Contents: read-only**, installed on **`camunda-hub` only**. Store its id
  and private key as the `HUB_SPEC_READER_APP_ID` / `HUB_SPEC_READER_APP_KEY`
  secrets in this repo. The `fetch-spec` action mints a short-lived (~1h),
  single-repo token per run — no long-lived credential, and not tied to a user.
  - Alternatives if an App isn't available: a read-only SSH **deploy key** on
    `camunda-hub` (`ssh-key:` on checkout), or a fine-grained **PAT** with
    Contents:read on `camunda-hub` (`token:` on checkout, ideally a service
    account). Both are long-lived and need manual rotation.
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
