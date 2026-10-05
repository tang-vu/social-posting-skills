# Doctor diagnostics

Run `social-posting-skills doctor` for readable environment and safety checks.
For scripts, CI, and agents, use `social-posting-skills doctor --json`.
`--ci` is an alias for `--json`; it does not make optional checks mandatory.
From a source checkout:

```bash
node bin/cli.js doctor --json > doctor-report.json
```

Invoke the CLI directly when parsing stdout. `npm run doctor -- --json` also
works interactively, but npm adds its own script banner to stdout.

## JSON contract (schema version 1)

The CLI writes one JSON object and a trailing newline to stdout. There are no
human headings, ANSI colors, or progress messages in this mode. Normal diagnostic
failures are reported in this object, not as raw exception messages on stderr.
The executable must be able to start; a broken Node installation or package that
cannot be imported can still fail before doctor runs.

Top-level fields:

- `schemaVersion`: integer `1`
- `ok`: `true` if there are no `fail` checks
- `exitCode`: `0` when `ok` is true, otherwise `1`; matches the process exit status
- `summary`: counts keyed by `pass`, `fail`, `warn`, and `info`; they sum to `checks.length`
- `checks`: ordered diagnostic entries

Each check has these fields:

```json
{
  "id": "store.writable",
  "name": "campaign store writable",
  "status": "fail",
  "detail": "Could not create, write, or remove a store probe",
  "remediation": "Check that .social-campaigns is a directory and the project and store are writable."
}
```

`status` is one of:

- `pass`: the stated check passed
- `fail`: a required local capability failed; exit status is `1`
- `warn`: something deserves attention, but does not prevent local-first use
- `info`: an optional capability is missing or not applicable

`remediation` is a suggested next step or `null`. Doctor never carries it out.
Use `id` and `status` for automation, not human-readable `name`, `detail`, or
`remediation`. Consumers should tolerate additional fields and new check IDs;
breaking changes to the contract require a new `schemaVersion`.

## Check IDs and boundaries

- `runtime.node`: Node.js meets the supported minimum
- `runtime.platform`: host platform and architecture
- `runtime.git`: Git is available for `git:` source ingestion; optional
- `platforms.metadata`: nonempty platform registry with IDs, review dates, and publish modes
- `adapters.registry`: adapters cover the same platform IDs without duplicates
- `store.writable`: `.social-campaigns/` supports creating, writing, and removing a temporary probe
- `skills.<target>`: install-manifest state and drift against the bundled skills, for each known install target
- `api.<platform>`: implemented API adapter and environment-variable presence, for platforms declaring an available API
- `safety.gitignore.campaigns`: an explicit `.social-campaigns/` ignore declaration exists
- `safety.gitignore.posts`: an explicit legacy `posts/` ignore declaration exists
- `safety.secret-files`: root-level filenames matching obvious secret patterns

Missing optional API credentials, Git, or skill installs do not make the command
fail. An unimplemented API is never marked ready, even when its environment
variables exist. Credential presence is not authentication: doctor makes no
network requests, verifies no tokens or platform permissions, and publishes
nothing. Empty or whitespace-only credential values count as missing.

Install diagnostics inspect the manifest against bundled sources; they are not
an integrity audit of every installed file. Project installs are resolved from
the project root; user installs use the same home-directory targets as the
installer. A malformed or unreadable manifest produces a warning and does not
stop the remaining checks.

Ignore diagnostics check explicit directory declarations in the local
`.gitignore`, not effective Git rules, global exclusions, tracked files, or later
negations. Commented or solely negated entries do not count. Secret-file detection
is a filename heuristic on the project root, not a recursive secret scanner.

## Privacy and local effects

Neither output mode includes environment-variable values, file contents, raw
exception messages, or sensitive-looking filenames. Reports name required env
variables, report suspicious filename counts, and avoid absolute project/home
paths. Review any diagnostic artifact before sharing it publicly.

Doctor may create `.social-campaigns/` if absent, as in the readable mode. It uses
a uniquely named temporary probe directory and removes it afterward; it never
reuses or overwrites `.probe`. It does not install skills, change ignore rules,
modify campaigns, or set credentials.
