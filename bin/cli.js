#!/usr/bin/env node
// social-posting-skills CLI entry.
// Bare `npx social-posting-skills` (or install flags only) = install (v2 compat).

import { main } from "../src/interfaces/cli.js";

main(process.argv.slice(2))
  .then((code) => process.exit(code ?? 0))
  .catch((e) => {
    console.error(`error: ${e.message ?? e}`);
    process.exit(1);
  });
