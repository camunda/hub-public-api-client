/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH under
 * one or more contributor license agreements. See the NOTICE file distributed
 * with this work for additional information regarding copyright ownership.
 * Licensed under the Camunda License 1.0. You may not use this file
 * except in compliance with the Camunda License 1.0.
 */

/**
 * Decide what kind of release (if any) an upstream spec change warrants, by diffing the
 * baseline spec (the one the last published version was built from) against the current
 * camunda-hub spec with `oasdiff`.
 *
 * Inputs (env):
 *   BASELINE_SPEC  path to the baseline root OpenAPI doc (rest-api.yaml)
 *   CURRENT_SPEC   path to the current root OpenAPI doc (rest-api.yaml)
 *
 * Outputs:
 *   - prints `decision=<none|minor|breaking>` and appends it to $GITHUB_OUTPUT
 *   - writes the human-readable changelog to `oasdiff-changelog.md` (for the PR body / job log)
 *
 * Decision:
 *   none      no significant change → nothing to publish
 *   minor     non-breaking change(s) → safe to auto-publish a minor
 *   breaking  at least one ERR-level (breaking) change → open a PR for human review + major bump
 *
 * `oasdiff` resolves $ref across files, so we only point it at the root document. Spec-level
 * breaking == client-level breaking, because the client is generated straight from the spec.
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync, appendFileSync } from 'node:fs';

const base = process.env.BASELINE_SPEC;
const rev = process.env.CURRENT_SPEC;

if (!base || !rev) {
  console.error('BASELINE_SPEC and CURRENT_SPEC must be set.');
  process.exit(1);
}

/** Run oasdiff; returns { stdout, code }. Does not throw on non-zero exit. */
function oasdiff(args) {
  try {
    const stdout = execFileSync('oasdiff', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
    return { stdout, code: 0 };
  } catch (err) {
    // execFileSync throws on non-zero exit; surface stdout + the exit code.
    if (typeof err.status === 'number') {
      return { stdout: err.stdout?.toString() ?? '', code: err.status };
    }
    throw err; // oasdiff missing / unexpected failure
  }
}

// 1. Are there any significant changes at all? (changelog json is [] when there are none)
const changelog = oasdiff(['changelog', base, rev, '-f', 'json']);
if (changelog.code !== 0) {
  console.error(`oasdiff changelog failed (exit ${changelog.code}):\n${changelog.stdout}`);
  process.exit(1);
}
let changes = [];
try {
  changes = JSON.parse(changelog.stdout.trim() || '[]');
} catch (err) {
  console.error(`Could not parse oasdiff changelog json: ${err.message}`);
  process.exit(1);
}

let decision;
if (!Array.isArray(changes) || changes.length === 0) {
  decision = 'none';
} else {
  // 2. Any breaking (ERR-level) change? `--fail-on ERR` makes oasdiff exit non-zero if so.
  const breaking = oasdiff(['breaking', base, rev, '--fail-on', 'ERR']);
  decision = breaking.code === 0 ? 'minor' : 'breaking';
}

// Human-readable changelog for the PR body / logs (best-effort).
const text = oasdiff(['changelog', base, rev]).stdout || '(no changelog produced)';
writeFileSync('oasdiff-changelog.md', text);

console.log(`decision=${decision}`);
console.log('--- oasdiff changelog ---');
console.log(text);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `decision=${decision}\n`);
}
