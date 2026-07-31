# Lumora Website

Production files for [lumoraofficial.de](https://lumoraofficial.de), served as a static GitHub Pages site.

## Structure

- `index.html` — compiled application and page markup; can also be opened directly in a browser.
- `assets/` — compiled stylesheet and local font files.
- `images/` — Lumora branding, transition artwork, studio artwork, and project previews.
- `video/` — interactive project preview films.
- `CNAME` — custom-domain configuration for GitHub Pages.
- `mcp/` — the static Lumora MCP toolkit at
  [lumoraofficial.de/mcp](https://lumoraofficial.de/mcp), including 3D models,
  Web Component recipes, machine-readable JSON endpoints, licences, and
  provenance.
- `mcp/browser/` — an HTML compatibility reader for browser environments that
  block top-level `.json` or `.md` navigation; it renders the same live
  manifest, instructions, and searchable records without replacing the raw
  machine endpoints.
- `mcp/context/` — a generated, static, no-JavaScript page containing the full
  manifest and complete instructions in one browser-friendly response.
- `robots.txt` and `sitemap.xml` — root-level crawler discovery, including an
  explicit allow rule for OpenAI's search crawler and canonical HTML entries.
- `llms.txt` — concise Markdown resource map for coding agents and other
  text-oriented clients.
- `llms-full.txt` — one-fetch copy of the current manifest and complete Codex
  instructions.
- `scripts/build-ai-discovery.mjs` — deterministically regenerates those four
  root discovery files from the committed MCP manifest and instructions.
- `scripts/build-mcp-catalog.mjs` — rebuilds the MCP catalogs from the verified
  Kenney ZIPs, Lumora Objects index, and owned-original component catalog.
- `scripts/import-design-assets.mjs` — refreshes or re-merges the multi-style
  Images/UI phase: full Lucide, grouped Phosphor variants, Open Doodles, Open
  Peeps, curated ambientCG materials, and Hero Patterns.
- `scripts/import-originkit-components.mjs` — refreshes or re-merges the
  complete linked OriginKit component inventory, including official detail
  pages and remote poster/video previews without mirroring source code.
- `scripts/import-linked-component-libraries.mjs` — refreshes or re-merges the
  public React Bits and complete Canvas UI inventories, including official
  registry commands and remote preview films. React Bits Pro is deliberately
  excluded.
- `scripts/import-pmndrs-examples.mjs` — refreshes or re-merges the curated
  agency-facing pmndrs Examples inventory: 80 R3F/WebGL scenes, scroll
  narratives, configurators, spatial interfaces, portals, materials, and
  production patterns with official thumbnails and pinned source links.
- `scripts/import-arlan-vault.mjs` — refreshes or re-merges all 15 published
  Arlan's Vault experiments with dedicated live demo/code pages, curated roles,
  optimized local selection previews, and linked MIT implementation sources.
- `scripts/component-selection-guidance.mjs` — classifies every component into
  structure or effects/motion search groups while explicitly granting Codex
  unrestricted authority over counts, combinations, placement, and repetition.
- `mcp/component-previews.js` — renders 85 owned component archetypes and
  activates one lightweight SVG motion profile only for the selected recipe.

The legal pages are part of the application and are available through:

- `./index.html?page=impressum`
- `./index.html?page=datenschutz`

The site does not require a server-side runtime or package installation.

## Lumora MCP

The canonical machine entry point is:

```text
https://lumoraofficial.de/mcp/manifest.json
```

The committed `/mcp` output is fully static. Rebuilding the catalog requires
Node.js plus the source asset archives; optional environment variables are
documented at the top of `scripts/build-mcp-catalog.mjs`.

After rebuilding the base catalog, re-merge the committed design asset snapshot:

```text
node scripts/import-design-assets.mjs
node scripts/import-originkit-components.mjs
node scripts/import-linked-component-libraries.mjs
node scripts/import-pmndrs-examples.mjs
node scripts/import-arlan-vault.mjs
node scripts/build-ai-discovery.mjs
node scripts/validate-mcp-catalog.mjs
```

Use `node scripts/import-design-assets.mjs --refresh` only when intentionally
refreshing the pinned upstream packages and official source records.
Use `node scripts/import-originkit-components.mjs --refresh` to reconcile the
committed OriginKit snapshot with its current public registry and sitemap.
Use `node scripts/import-linked-component-libraries.mjs --refresh` to reconcile
the pinned React Bits and Canvas UI snapshots with their current public
repositories, licences, registries, and preview inventories.
Use `node scripts/import-pmndrs-examples.mjs --refresh` to refresh the pinned
pmndrs revision and curated metadata. Run it after the other component
importers so the final manifest, provenance, and component index include the
R3F/WebGL collection.
Use `node scripts/import-arlan-vault.mjs --refresh` to recheck the current
published detail pages and their MIT markers. Run it last so its manifest,
provenance, component index, and open selection guidance remain final.
Run `node scripts/build-ai-discovery.mjs` after any manifest or instruction
change so crawler and one-fetch agent resources always match the live catalog.
