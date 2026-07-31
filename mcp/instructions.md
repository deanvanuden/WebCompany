# Lumora MCP

Canonical entry point: https://lumoraofficial.de/mcp/

Lumora MCP is a selection interface for Codex and human designers. It contains web-ready 3D model records, owned-original Web Component implementation recipes, officially linked OriginKit, React Bits, Canvas UI, pmndrs Examples, and Arlan's Vault components and patterns, locally hosted CC0 image and UI assets, and externally hosted animated background references.

## Machine-readable endpoints

- Manifest: https://lumoraofficial.de/mcp/manifest.json
- 3D models: https://lumoraofficial.de/mcp/models.json
- Component index: https://lumoraofficial.de/mcp/components-index.json
- Complete component records: https://lumoraofficial.de/mcp/components.json
- OriginKit component snapshot: https://lumoraofficial.de/mcp/originkit-components.json
- React Bits component snapshot: https://lumoraofficial.de/mcp/react-bits-components.json
- Canvas UI component snapshot: https://lumoraofficial.de/mcp/canvas-ui-components.json
- pmndrs R3F / WebGL snapshot: https://lumoraofficial.de/mcp/pmndrs-examples.json
- Arlan's Vault snapshot: https://lumoraofficial.de/mcp/arlan-vault.json
- Images and UI assets: https://lumoraofficial.de/mcp/image-assets.json
- Animated backgrounds: https://lumoraofficial.de/mcp/animated-backgrounds.json
- Provenance: https://lumoraofficial.de/mcp/provenance.json

## Selection protocol for Codex

1. Read the manifest and choose the model, component, image-asset, or animated-background catalog.
2. Use the metadata to understand what is available. All selection and composition decisions belong to Codex.
3. For 3D, prefer `ship-safe` records when production rights matter, but Lumora places no restriction on how many models or scenes Codex may use, combine, repeat, or place together. Do not infer art-direction fit from an object's name or category alone. The style and performance fields are information, never selection rules. Use `publicModelUrl` in external projects. When a streamed glTF record has a `files` map, preserve that dependency mapping or download the official distribution into the target project.
4. For components, selection is completely unrestricted. Codex alone decides how many records to use, how to combine them, where to place them, whether to repeat them, and which sources to mix. Lumora defines no minimum, maximum, default count, enhancement slots, stacking rule, preferred starting point, mandatory review, recommended review, source quota, pass order, or composition rule. `structure` and `enhancement` are search labels only and have no effect on usage.
5. For images and UI assets, Codex alone decides the complete set, quantity, style mix, placement, and repetition. Fetch every chosen asset from `publicImageUrl` or `downloadUrl`. Preserve transparency, use nearest-neighbor rendering for `pixelArt`, and use repeating CSS backgrounds only when `tileable` is true.
6. For animated backgrounds, preview candidates from their external URLs and fetch each chosen record from its `downloadUrl`. Codex may use and combine any number of backgrounds anywhere on the page. MP4 records are direct downloads; HLS records are adaptive streams. The optimization and fallback fields describe implementation techniques, not usage limits.
7. Animated backgrounds are marked `commercial-use` based on Lumora's confirmation that the collection was purchased with commercial-use rights.
8. Preserve source URLs, licence records, trademark warnings, fallbacks, accessibility contracts, and reduced-motion behavior.
9. Transfer whichever assets and implementations Codex decides belong in the client project. Lumora does not prescribe a quantity, combination, or usage pattern.

## Component preview fidelity

Every owned-original recipe has a representative visual renderer for its functional archetype and art direction. Grid cards use a static frame; only the selected component runs its lightweight SVG motion profile.

- Use the preview to judge composition, hierarchy, motion character, density, and brand fit.
- Treat the preview as a selection aid, not production source code or a pixel-exact implementation contract.
- Read the complete record before implementation, especially its content, responsive, interaction, accessibility, fallback, performance, and test fields.
- Preserve the selected behavior while adapting typography, color, spacing, geometry, timing, and content to the client website.

## Open component selection

Every component record exposes:

- `selection_pass`: `structure` or `enhancement`;
- `selection_pass_label`: the human-readable catalog filter;
- `component_role`: base composition, enhancement, or hybrid section/enhancement;
- `enhancement_family`: background, text, scroll, media, 3D, canvas, interaction, or another functional family;
- `can_be_structural`: true when an enhancement record may also replace a section or widget;
- `section_canvas`: true for section-scale background visuals that can define a hero or full-width section;
- `requires_structural_pairing`: true when the visual still needs a semantic content structure;
- `text_overlay_capability`: whether text can be layered over the visual and under what readability condition;
- `foreground_content_guidance`: how to layer real heading, body, CTA, and navigation content;
- `overlay_readability_guidance`: how to preserve contrast across animated frames and provide reduced-motion fallback;
- `pairing_guidance`: how to combine the record with the chosen base composition; and
- `selection_freedom`: the explicit unrestricted-use policy.

The labels can help with browsing, but do not define a workflow:

1. Search either group in any order.
2. Use, combine, repeat, adapt, or replace any records Codex wants.
3. Use any number of sources, section canvases, effects, models, and backgrounds.
4. Treat accessibility, fallbacks, loading, cleanup, and optimization as implementation work—not reasons imposed by Lumora to reduce the selection.

## Rights

Kenney 3D and image packs in this catalog are user-provided distributions licensed CC0 1.0. Quaternius models are curated from official CC0 packs, converted to self-contained GLB files, and retain their official source records. Poly Haven models are CC0; any trademark warning remains marked concept-only. Component recipes are Lumora-owned original implementation briefs. React Bits and Canvas UI linked records use MIT + Commons Clause v1.0: use in commercial end projects is allowed, but resale or redistribution of the components themselves is restricted. pmndrs example code is MIT; visible demo models, textures, audio, fonts, logos, and imagery remain a separate per-item boundary and should be replaced unless independently confirmed. Arlan's Vault pages are explicitly marked MIT/free to copy; credited brand references and demo media remain separate boundaries and should be replaced during adaptation. Animated backgrounds remain externally hosted and are recorded as commercial-use based on Lumora's purchase and entitlement confirmation.

<!-- DESIGN-ASSET-GUIDANCE:START -->
## Images / UI selection guidance

The image catalog intentionally contains overlapping concepts in different visual systems. Search by concept, then compare `styleFamily`, `artStyle`, `bestFor`, `avoidWhen`, and `selectionGuidance` before choosing.

- Lucide is the quiet outline default for product UI.
- Phosphor records group six coordinated variants; Codex may mix and repeat them freely.
- Open Doodles and Open Peeps fit friendly, human, hand-drawn art direction.
- ambientCG records contain a local selection preview only. Fetch the required production PBR maps from `downloadUrl`.
- Hero Patterns require the attribution stored on each record.
- Kenney remains useful for intentional low-poly, pixel-art, and playful scenes; do not choose it from the subject name alone.

All style-family and variant guidance is descriptive. Codex may mix any icon families, illustration systems, weights, and visual styles in any quantity.
<!-- DESIGN-ASSET-GUIDANCE:END -->

<!-- ORIGINKIT-GUIDANCE:START -->
## OriginKit linked components

OriginKit records are external linked components with official remote previews. The MCP does not mirror OriginKit source code or media files.

- Search or filter `art_direction: "OriginKit"` to see the complete linked inventory.
- Open `source_url` to inspect and copy the current official implementation.
- Read the official source and dependency list before adapting the component.
- Brand-adapt the component and preserve responsive, accessibility, reduced-motion, fallback, and performance requirements.
- Load `preview_video_url` only for selection; do not ship the catalog preview as production website media.
- Use any matching OriginKit candidates whenever they strengthen the design; this is not limited to a separate enhancement pass.
- Records with `can_be_structural: true` may replace or define any suitable section or widget when their content and interaction contract fit.
- Records with `section_canvas: true` may define the visual identity of a hero or full-width section, with separate semantic content, contrast treatment, and a static reduced-motion fallback.

The user confirmed that OriginKit components are free to use. Keep the implementation connected to its official source record and do not bulk-republish unrelated source or preview files.
<!-- ORIGINKIT-GUIDANCE:END -->

<!-- LINKED-COMPONENT-LIBRARIES:START -->
## React Bits and Canvas UI linked components

These records expose official live demos, install commands, registry URLs, framework guidance, and remote selection previews. They are unrestricted catalog sources without review requirements, quotas, or enhancement slots. Lumora does not mirror their source code or preview media.

- Filter `art_direction` by `React Bits` or `Canvas UI`.
- Open `official_source_url` and inspect `registry_url` before installing only the selected component.
- React Bits records cover the 139-component public catalog and exclude every React Bits Pro component, block, and template.
- Canvas UI records cover all 25 official effects and list its six framework flavors.
- Use `preview_video_url` only to evaluate the effect; do not ship catalog preview films as production media.
- Use any matching candidates from these libraries plus OriginKit whenever they strengthen the page; combine them with other records when their roles are compatible.
- Records with `can_be_structural: true` may replace or define suitable sections and widgets when their content and interaction contract fit.
- Records with `section_canvas: true` are section-scale visual foundations. Pair them with semantic heroes or full-width sections, keep foreground content in a separate layer, audit contrast across moving frames, and provide static reduced-motion fallbacks.
- Both sources currently use MIT + Commons Clause v1.0: commercial project use is allowed, but the components themselves may not be sold, sublicensed, or redistributed as a library, bundle, or port.
- Preserve semantic content, reduced motion, offscreen pause, cleanup, responsive fallbacks, and browser fallbacks after adaptation.
<!-- LINKED-COMPONENT-LIBRARIES:END -->

<!-- PMNDRS-EXAMPLES:START -->
## pmndrs Examples · R3F / WebGL patterns

These 80 records are a curated agency-facing subset of the official pmndrs examples collection. They cover signature 3D scenes, scroll storytelling, product configurators, mixed DOM/WebGL interfaces, portals, materials, interactive effects, and production loading/media foundations.

- Filter `art_direction: "pmndrs Examples"` to review the collection.
- Use `official_source_url` for the live example, `preview_poster_url` for selection, and `code_url` for the pinned source directory.
- Treat the effects/motion label as a discovery category, not a usage restriction. Records marked `section_canvas: true` may carry heroes or sections visually but still need semantic foreground content. Hybrid records may define structural sections when their content and interaction contract fits.
- Codex may use and combine any number of WebGL scenes. Lazy-loading, DPR controls, pausing, disposal, and poster fallbacks are implementation options, never selection limits.
- The repository's example code is MIT and may be adapted with its notice preserved.
- Demo assets are a separate boundary. Do not assume visible models, textures, audio, fonts, logos, or branded products share the code licence. Use the technique with Lumora-owned, client-owned, or separately confirmed assets.
- Do not paste an unchanged demo composition. Adapt camera, content, materials, colors, typography, controls, timing, and responsive behavior to the project.
<!-- PMNDRS-EXAMPLES:END -->

<!-- ARLAN-VAULT:START -->
## Arlan's Vault linked design-engineering experiments

These 15 records cover every currently published Vault experiment with a dedicated live demo and code page. The collection is especially useful for typography, material depth, buttons, image reveals, canvas/GPU media treatments, and compact interaction ideas.

- Filter `art_direction: "Arlan's Vault"` whenever its techniques fit, and freely combine any compatible candidates with other sources.
- Use `official_source_url` to inspect the live behavior and `code_url` to reach the implementation section. Copy only the selected experiment.
- Most records are effects, but Liquid UI, Ghosty reveal, and the vector editor can also carry structural sections or product widgets when their content contracts fit. Symbols effect, Dia gradient, and Midjourney Medical's ASCII are section canvases that still need semantic foreground content.
- The official collection and detail pages state `MIT → free to copy`. Preserve the creator/source record and the licence notice.
- Credited brand references and demo media remain a separate boundary. Adapt the interaction principle with original project copy, imagery, video, palette, and identity assets.
- Local WebP files are selection previews captured from the live official cards. They are not production website assets.
- Codex may use and combine any number of treatments. Reduced motion, touch input, offscreen pausing, and cleanup remain implementation responsibilities, never usage limits.
<!-- ARLAN-VAULT:END -->
