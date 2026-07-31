# Lumora MCP

Canonical entry point: https://lumoraofficial.de/mcp/

Lumora MCP is a selection interface for Codex and human designers. It contains web-ready 3D model records, owned-original Web Component implementation recipes, officially linked OriginKit, React Bits, Canvas UI, and pmndrs Examples components and patterns, locally hosted CC0 image and UI assets, and externally hosted animated background references.

## Machine-readable endpoints

- Manifest: https://lumoraofficial.de/mcp/manifest.json
- 3D models: https://lumoraofficial.de/mcp/models.json
- Component index: https://lumoraofficial.de/mcp/components-index.json
- Complete component records: https://lumoraofficial.de/mcp/components.json
- OriginKit component snapshot: https://lumoraofficial.de/mcp/originkit-components.json
- React Bits component snapshot: https://lumoraofficial.de/mcp/react-bits-components.json
- Canvas UI component snapshot: https://lumoraofficial.de/mcp/canvas-ui-components.json
- pmndrs R3F / WebGL snapshot: https://lumoraofficial.de/mcp/pmndrs-examples.json
- Images and UI assets: https://lumoraofficial.de/mcp/image-assets.json
- Animated backgrounds: https://lumoraofficial.de/mcp/animated-backgrounds.json
- Provenance: https://lumoraofficial.de/mcp/provenance.json

## Selection protocol for Codex

1. Read the manifest and choose the model, component, image-asset, or animated-background catalog.
2. Filter candidates by the real page goal, brand, framework, performance budget, and asset class.
3. For 3D, prefer `ship-safe` records and load only the selected model. Do not infer art-direction fit from an object's name or category alone. Filter by `agencyUse`, `brandMoods`, `websiteIndustries`, `sectionFits`, and `performanceGuidance`. For Kenney records, also read `visualFidelity`, `selectionPriority`, `selectionGuidance`, `avoidWhen`, and `fallbackPolicy`. This guidance is advisory: a simplified asset remains usable when no closer match exists, but should be adapted deliberately and usually kept secondary unless low-poly styling is intentional. Use `publicModelUrl` in external projects. When a streamed glTF record has a `files` map, preserve that dependency mapping or download the official distribution into the target project.
4. For components, always work in two passes. Pass 1 selects the structural layout or section recipe. Pass 2 must explicitly review compatible effects, motion, text, background, media, cursor, scroll, canvas, and WebGL treatments, including the best matching candidates from OriginKit, React Bits, Canvas UI, and pmndrs Examples. A valid Pass 2 result is “use none”; skipping the review is not valid. Choose zero to three enhancements total, normally one signature and up to two supporting or subtle treatments. Linked records marked `can_be_structural: true` may replace one section when their content and interaction contract are stronger than the Pass 1 candidate. Records marked `section_canvas: true` may define an entire hero or section visually, but still require a semantic Pass 1 content structure.
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

## Two-pass component selection

Every component record exposes:

- `selection_pass`: `structure` or `enhancement`;
- `selection_pass_label`: the human-readable catalog filter;
- `component_role`: base composition, enhancement, or hybrid section/enhancement;
- `enhancement_family`: background, text, scroll, media, 3D, canvas, interaction, or another functional family;
- `required_review`: true for linked OriginKit, React Bits, Canvas UI, and pmndrs Examples records;
- `can_be_structural`: true when an enhancement record may also replace a section or widget;
- `section_canvas`: true for section-scale background visuals that can define a hero or full-width section;
- `requires_structural_pairing`: true when the visual still needs a semantic Pass 1 content structure;
- `text_overlay_capability`: whether text can be layered over the visual and under what readability condition;
- `foreground_content_guidance`: how to layer real heading, body, CTA, and navigation content;
- `overlay_readability_guidance`: how to preserve contrast across animated frames and provide reduced-motion fallback;
- `pairing_guidance`: how to combine the record with the chosen base composition; and
- `stacking_limit`: the maximum continuous or heavy effects to keep active together.

Selection sequence:

1. Filter `selection_pass: "structure"` and choose the base page or section hierarchy.
2. Record the chosen structure and its brand, content, responsive, accessibility, and performance constraints.
3. Filter `selection_pass: "enhancement"` and scan all relevant enhancement families.
4. During that second pass, compare the best matching candidates from OriginKit, React Bits, Canvas UI, pmndrs Examples, and Lumora-owned enhancement recipes. Do not stop after the first source.
5. Select zero to three enhancements, reject duplication, and keep only one heavy canvas, WebGL, or 3D effect in or near the initial viewport.

## Rights

Kenney 3D and image packs in this catalog are user-provided distributions licensed CC0 1.0. Quaternius models are curated from official CC0 packs, converted to self-contained GLB files, and retain their official source records. Poly Haven models are CC0; any trademark warning remains marked concept-only. Component recipes are Lumora-owned original implementation briefs. React Bits and Canvas UI linked records use MIT + Commons Clause v1.0: use in commercial end projects is allowed, but resale or redistribution of the components themselves is restricted. pmndrs example code is MIT; visible demo models, textures, audio, fonts, logos, and imagery remain a separate per-item boundary and should be replaced unless independently confirmed. Animated backgrounds remain externally hosted and are recorded as commercial-use based on Lumora's purchase and entitlement confirmation.

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

OriginKit records are external linked components with official remote previews and are required-review candidates during Pass 2. The MCP does not mirror OriginKit source code or media files.

- Search or filter `art_direction: "OriginKit"` to see the complete linked inventory.
- Open `source_url` to inspect and copy the current official implementation.
- Read the official source and dependency list before adapting the component.
- Brand-adapt the component and preserve responsive, accessibility, reduced-motion, fallback, and performance requirements.
- Load `preview_video_url` only for selection; do not ship the catalog preview as production website media.
- Compare the best matching OriginKit candidate after choosing the base layout, even when the final decision is to use none.
- Records with `can_be_structural: true` may also replace one section or widget when their content and interaction contract are a stronger fit.
- Records with `section_canvas: true` may define the visual identity of a hero or full-width section, but still require separate semantic Pass 1 content, contrast treatment, and a static reduced-motion fallback.

The user confirmed that OriginKit components are free to use. Keep the implementation connected to its official source record and do not bulk-republish unrelated source or preview files.
<!-- ORIGINKIT-GUIDANCE:END -->

<!-- LINKED-COMPONENT-LIBRARIES:START -->
## React Bits and Canvas UI linked components

These records expose official live demos, install commands, registry URLs, framework guidance, and remote selection previews. They are required-review candidates during Pass 2, even when the final decision is to use none. Lumora does not mirror their source code or preview media.

- Filter `art_direction` by `React Bits` or `Canvas UI`.
- Open `official_source_url` and inspect `registry_url` before installing only the selected component.
- React Bits records cover the 139-component public catalog and exclude every React Bits Pro component, block, and template.
- Canvas UI records cover all 25 official effects and list its six framework flavors.
- Use `preview_video_url` only to evaluate the effect; do not ship catalog preview films as production media.
- After choosing a structural recipe, compare the best matching candidates from both libraries plus OriginKit before finalizing the enhancement shortlist.
- Records with `can_be_structural: true` may also replace one section or widget when their content and interaction contract are a stronger fit.
- Records with `section_canvas: true` are section-scale visual foundations. Pair one with a semantic Pass 1 hero or full-width section, keep foreground content in a separate layer, audit contrast across moving frames, and provide a static reduced-motion fallback.
- Both sources currently use MIT + Commons Clause v1.0: commercial project use is allowed, but the components themselves may not be sold, sublicensed, or redistributed as a library, bundle, or port.
- Preserve semantic content, reduced motion, offscreen pause, cleanup, responsive fallbacks, and browser fallbacks after adaptation.
<!-- LINKED-COMPONENT-LIBRARIES:END -->

<!-- PMNDRS-EXAMPLES:START -->
## pmndrs Examples · R3F / WebGL patterns

These 80 records are a curated agency-facing subset of the official pmndrs examples collection. They cover signature 3D scenes, scroll storytelling, product configurators, mixed DOM/WebGL interfaces, portals, materials, interactive effects, and production loading/media foundations.

- Filter `art_direction: "pmndrs Examples"` to review the collection.
- Use `official_source_url` for the live example, `preview_poster_url` for selection, and `code_url` for the pinned source directory.
- Treat every record as Pass 2. Records marked `section_canvas: true` may carry a hero or section visually but still need semantic foreground content. Hybrid records may replace one section when their content and interaction contract is a stronger fit.
- Use only one heavy WebGL scene near the initial viewport, lazy-load it, cap DPR and postprocessing, pause it offscreen, dispose resources, and provide a designed poster fallback.
- The repository's example code is MIT and may be adapted with its notice preserved.
- Demo assets are a separate boundary. Do not assume visible models, textures, audio, fonts, logos, or branded products share the code licence. Use the technique with Lumora-owned, client-owned, or separately confirmed assets.
- Do not paste an unchanged demo composition. Adapt camera, content, materials, colors, typography, controls, timing, and responsive behavior to the project.
<!-- PMNDRS-EXAMPLES:END -->
