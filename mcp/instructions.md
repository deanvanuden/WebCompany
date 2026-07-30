# Lumora MCP

Canonical entry point: https://lumoraofficial.de/mcp/

Lumora MCP is a selection interface for Codex and human designers. It contains web-ready 3D model records, owned-original Web Component implementation recipes, linked OriginKit components, locally hosted CC0 image and UI assets, and externally hosted animated background references.

## Machine-readable endpoints

- Manifest: https://lumoraofficial.de/mcp/manifest.json
- 3D models: https://lumoraofficial.de/mcp/models.json
- Component index: https://lumoraofficial.de/mcp/components-index.json
- Complete component records: https://lumoraofficial.de/mcp/components.json
- OriginKit component snapshot: https://lumoraofficial.de/mcp/originkit-components.json
- Images and UI assets: https://lumoraofficial.de/mcp/image-assets.json
- Animated backgrounds: https://lumoraofficial.de/mcp/animated-backgrounds.json
- Provenance: https://lumoraofficial.de/mcp/provenance.json

## Selection protocol for Codex

1. Read the manifest and choose the model, component, image-asset, or animated-background catalog.
2. Filter candidates by the real page goal, brand, framework, performance budget, and asset class.
3. For 3D, prefer `ship-safe` records and load only the selected model. Do not infer art-direction fit from an object's name or category alone. Filter by `agencyUse`, `brandMoods`, `websiteIndustries`, `sectionFits`, and `performanceGuidance`. For Kenney records, also read `visualFidelity`, `selectionPriority`, `selectionGuidance`, `avoidWhen`, and `fallbackPolicy`. This guidance is advisory: a simplified asset remains usable when no closer match exists, but should be adapted deliberately and usually kept secondary unless low-poly styling is intentional. Use `publicModelUrl` in external projects. When a streamed glTF record has a `files` map, preserve that dependency mapping or download the official distribution into the target project.
4. For components, choose zero to three candidates. Build owned-original recipes from first principles in the target project's conventions; for linked OriginKit records, inspect the current official source before adapting it.
5. For images and UI assets, choose only the records that serve the composition, then fetch each winner from `publicImageUrl` or `downloadUrl`. Preserve transparency, use nearest-neighbor rendering for `pixelArt`, and use repeating CSS backgrounds only when `tileable` is true.
6. For animated backgrounds, preview candidates from their external URLs, select one winner, and then fetch only that record's `downloadUrl`. MP4 records are direct downloads; HLS records are adaptive streams. Optimize the selected media locally and provide a static reduced-motion fallback.
7. Animated backgrounds are marked `commercial-use` based on Lumora's confirmation that the collection was purchased with commercial-use rights.
8. Preserve source URLs, licence records, trademark warnings, fallbacks, accessibility contracts, and reduced-motion behavior.
9. Do not mirror the entire catalog into a client project. Copy only the chosen assets or implement only the chosen recipes.

## Component preview fidelity

Every owned-original recipe has a representative visual renderer for its functional archetype and art direction. Grid cards use a static frame; only the selected component runs its lightweight SVG motion profile.

- Use the preview to judge composition, hierarchy, motion character, density, and brand fit.
- Treat the preview as a selection aid, not production source code or a pixel-exact implementation contract.
- Read the complete record before implementation, especially its content, responsive, interaction, accessibility, fallback, performance, and test fields.
- Preserve the selected behavior while adapting typography, color, spacing, geometry, timing, and content to the client website.

## Rights

Kenney 3D and image packs in this catalog are user-provided distributions licensed CC0 1.0. Quaternius models are curated from official CC0 packs, converted to self-contained GLB files, and retain their official source records. Poly Haven models are CC0; any trademark warning remains marked concept-only. Component recipes are Lumora-owned original implementation briefs. Animated backgrounds remain externally hosted and are recorded as commercial-use based on Lumora's purchase and entitlement confirmation.

<!-- DESIGN-ASSET-GUIDANCE:START -->
## Images / UI selection guidance

The image catalog intentionally contains overlapping concepts in different visual systems. Search by concept, then compare `styleFamily`, `artStyle`, `bestFor`, `avoidWhen`, and `selectionGuidance` before choosing.

- Lucide is the quiet outline default for product UI.
- Phosphor records group six coordinated variants; choose one weight consistently.
- Open Doodles and Open Peeps fit friendly, human, hand-drawn art direction.
- ambientCG records contain a local selection preview only. Fetch the required production PBR maps from `downloadUrl`.
- Hero Patterns require the attribution stored on each record.
- Kenney remains useful for intentional low-poly, pixel-art, and playful scenes; do not choose it from the subject name alone.

Do not mix icon families or illustration systems casually. Prefer one primary family and one deliberately contrasting supporting family.
<!-- DESIGN-ASSET-GUIDANCE:END -->

<!-- ORIGINKIT-GUIDANCE:START -->
## OriginKit linked components

OriginKit records are external linked components with official remote previews. The MCP does not mirror OriginKit source code or media files.

- Search or filter `art_direction: "OriginKit"` to see the complete linked inventory.
- Open `source_url` to inspect and copy the current official implementation.
- Read the official source and dependency list before adapting the component.
- Brand-adapt the component and preserve responsive, accessibility, reduced-motion, fallback, and performance requirements.
- Load `preview_video_url` only for selection; do not ship the catalog preview as production website media.

The user confirmed that OriginKit components are free to use. Keep the implementation connected to its official source record and do not bulk-republish unrelated source or preview files.
<!-- ORIGINKIT-GUIDANCE:END -->
