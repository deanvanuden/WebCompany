# Lumora MCP

Canonical entry point: https://lumoraofficial.de/mcp/

Lumora MCP is a selection interface for Codex and human designers. It contains web-ready 3D model records and original Web Component implementation recipes.

## Machine-readable endpoints

- Manifest: https://lumoraofficial.de/mcp/manifest.json
- 3D models: https://lumoraofficial.de/mcp/models.json
- Component index: https://lumoraofficial.de/mcp/components-index.json
- Complete component records: https://lumoraofficial.de/mcp/components.json
- Provenance: https://lumoraofficial.de/mcp/provenance.json

## Selection protocol for Codex

1. Read the manifest and choose either the model or component catalog.
2. Filter candidates by the real page goal, brand, framework, performance budget, and rights class.
3. For 3D, prefer `ship-safe` records and load only the selected model. Use `publicModelUrl` in external projects. When a streamed glTF record has a `files` map, preserve that dependency mapping or download the official distribution into the target project.
4. For components, choose zero to three recipes. Treat each record as an implementation brief and build it from first principles in the target project's conventions.
5. Preserve source URLs, creator names, licences, trademark warnings, fallbacks, accessibility contracts, and reduced-motion behavior.
6. Do not mirror the entire catalog into a client project. Copy only the chosen assets or implement only the chosen recipes.

## Rights

Kenney packs in this catalog are the user-provided GLB distributions licensed CC0 1.0. Poly Haven models are CC0; any trademark warning remains marked concept-only. Component recipes are Lumora-owned original implementation briefs.
