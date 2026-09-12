# Reagent scheduler dependency review

The actual production Reagent bundle imports only `@open-hax/uxx`, `@open-hax/uxx/primitives`, and `react`. It has no `scheduler` import and no bundled ReactDOM subpath requiring a bare scheduler from the adapter. The earlier claim that Reagent needed a direct scheduler dependency was not supported by this emitted artifact.

The unnecessary Reagent manifest dependency and its lockfile importer entry are removed. Root/ReactDOM dependencies are unchanged. The packed-consumer verifier now supplies only the declared React/ReactDOM peers beside the adapters, explicitly proves that `scheduler` cannot resolve from each extracted artifact, and imports both real packages. ReactDOM can still load its own legitimate transitive dependencies.

Fresh 2026-09-12 proof: both production adapters built with zero compiler warnings, their actual `npm pack` prepack hooks rebuilt the release artifacts, and the extracted packages each exposed 63 exports with one shared React identity and no ambient scheduler. The packed check passed in 0.356 seconds and removed its temporary consumer. [Actual result](evidence/uxx-review-packed-no-scheduler.txt) includes archive hashes. Strict lint, TypeScript checking, and all 466 tests across 33 files passed. These are real package imports, not an assertion over source text alone.

Reproduce after installing the locked workspace dependencies:

```sh
pnpm build:all
mkdir -p /tmp/uxx-pack-proof
(cd helix && npm pack --pack-destination /tmp/uxx-pack-proof)
(cd reagent && npm pack --pack-destination /tmp/uxx-pack-proof)
node scripts/verify-packed-adapters.mjs /tmp/uxx-pack-proof/open-hax-uxx-helix-0.1.0.tgz /tmp/uxx-pack-proof/open-hax-uxx-reagent-0.1.0.tgz
pnpm lint
pnpm typecheck
pnpm test
```

The recovery install reused the shared offline pnpm store. A lockfile-only re-resolution failed because unrelated Storybook version metadata was absent from the offline metadata cache. Removing only the obsolete four-line Reagent importer entry, while preserving all still-used scheduler package snapshots, then passed `pnpm install --frozen-lockfile --offline`. Pnpm's existing ignored-esbuild-build-script notice was recorded; the actual esbuild-dependent build/tests still ran successfully. No installer warning was suppressed. The committed JSON records preserve original run paths; matching `.txt` files are durable copies of the output.
