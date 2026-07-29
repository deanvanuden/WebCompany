# Lumora MCP

Canonical entry point: https://lumoraofficial.de/mcp/

Lumora MCP is a selection interface for Codex and human designers. It contains web-ready 3D model records, original Web Component implementation recipes, locally hosted CC0 image and UI assets, and externally hosted animated background references.

## Machine-readable endpoints

- Manifest: https://lumoraofficial.de/mcp/manifest.json
- 3D models: https://lumoraofficial.de/mcp/models.json
- Component index: https://lumoraofficial.de/mcp/components-index.json
- Complete component records: https://lumoraofficial.de/mcp/components.json
- Images and UI assets: https://lumoraofficial.de/mcp/image-assets.json
- Animated backgrounds: https://lumoraofficial.de/mcp/animated-backgrounds.json
- Provenance: https://lumoraofficial.de/mcp/provenance.json

## Selection protocol for Codex

1. Read the manifest and choose the model, component, image-asset, or animated-background catalog.
2. Filter candidates by the real page goal, brand, framework, performance budget, and asset class.
3. For 3D, prefer `ship-safe` records and load only the selected model. Do not infer art-direction fit from an object's name or category alone. Filter by `agencyUse`, `brandMoods`, `websiteIndustries`, `sectionFits`, and `performanceGuidance`. For Kenney records, also read `visualFidelity`, `selectionPriority`, `selectionGuidance`, `avoidWhen`, and `fallbackPolicy`. This guidance is advisory: a simplified asset remains usable when no closer match exists, but should be adapted deliberately and usually kept secondary unless low-poly styling is intentional. Use `publicModelUrl` in external projects. When a streamed glTF record has a `files` map, preserve that dependency mapping or download the official distribution into the target project.
4. For components, choose zero to three recipes. Treat each record as an implementation brief and build it from first principles in the target project's conventions.
5. For images and UI assets, choose only the records that serve the composition, then fetch each winner from `publicImageUrl` or `downloadUrl`. Preserve transparency, use nearest-neighbor rendering for `pixelArt`, and use repeating CSS backgrounds only when `tileable` is true.
6. For animated backgrounds, preview candidates from their external URLs, select one winner, and then fetch only that record's `downloadUrl`. MP4 records are direct downloads; HLS records are adaptive streams. Optimize the selected media locally and provide a static reduced-motion fallback.
7. Animated backgrounds are marked `commercial-use` based on Lumora's confirmation that the collection was purchased with commercial-use rights.
8. Preserve source URLs, licence records, trademark warnings, fallbacks, accessibility contracts, and reduced-motion behavior.
9. Do not mirror the entire catalog into a client project. Copy only the chosen assets or implement only the chosen recipes.

## Rights

Kenney 3D and image packs in this catalog are user-provided distributions licensed CC0 1.0. Quaternius models are curated from official CC0 packs, converted to self-contained GLB files, and retain their official source records. Poly Haven models are CC0; any trademark warning remains marked concept-only. Component recipes are Lumora-owned original implementation briefs. Animated backgrounds remain externally hosted and are recorded as commercial-use based on Lumora's purchase and entitlement confirmation.
