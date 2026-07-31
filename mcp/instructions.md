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
2. Filter candidates by the real page goal, brand, framework, performance budget, and asset class.
3. For 3D, prefer `ship-safe` records and load only models actually used. There is no model-count quota: use multiple models or scenes when they serve the concept and manage their simultaneous rendering cost. Do not infer art-direction fit from an object's name or category alone. Filter by `agencyUse`, `brandMoods`, `websiteIndustries`, `sectionFits`, and `performanceGuidance`. For Kenney records, also read `visualFidelity`, `selectionPriority`, `selectionGuidance`, `avoidWhen`, and `fallbackPolicy`. This guidance is advisory: a simplified asset remains usable when no closer match exists, but should be adapted deliberately and usually kept secondary unless low-poly styling is intentional. Use `publicModelUrl` in external projects. When a streamed glTF record has a `files` map, preserve that dependency mapping or download the official distribution into the target project.
4. For components, treat Lumora as an open advisory library, not a quota system or rigid workflow. The `structure` and `enhancement` labels are browsing lenses that help prevent tunnel vision; use them in either order, revisit them freely, and select, combine, adapt, repeat, or omit any number of records from any source. Use as many components, effects, backgrounds, section canvases, and 3D treatments as the page genuinely benefits from. Judge the result by page purpose, visual coherence, accessibility, and measured simultaneous runtime cost—not by a catalog count. Linked records marked `can_be_structural: true` may replace or define a section. Records marked `section_canvas: true` may define an entire hero or section visually when paired with semantic foreground content.
5. For images and UI assets, choose only the records that serve the composition, then fetch each winner from `publicImageUrl` or `downloadUrl`. Preserve transparency, use nearest-neighbor rendering for `pixelArt`, and use repeating CSS backgrounds only when `tileable` is true.
6. For animated backgrounds, preview candidates from their external URLs and fetch only the records actually used from each `downloadUrl`. A page may use different backgrounds in different sections when the art direction remains coherent. MP4 records are direct downloads; HLS records are adaptive streams. Optimize selected media locally, lazy-load below-fold media, pause it offscreen, and provide static reduced-motion fallbacks.
7. Animated backgrounds are marked `commercial-use` based on Lumora's confirmation that the collection was purchased with commercial-use rights.
8. Preserve source URLs, licence records, trademark warnings, fallbacks, accessibility contracts, and reduced-motion behavior.
9. Do not mirror the entire catalog into a client project. Copy only the chosen assets or implement only the chosen recipes.

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
- `recommended_review`: true for linked OriginKit, React Bits, Canvas UI, pmndrs Examples, and Arlan's Vault records so they remain visible during discovery;
- `required_review`: retained for compatibility and false; no source is a mandatory gate;
- `can_be_structural`: true when an enhancement record may also replace a section or widget;
- `section_canvas`: true for section-scale background visuals that can define a hero or full-width section;
- `requires_structural_pairing`: true when the visual still needs a semantic content structure;
- `text_overlay_capability`: whether text can be layered over the visual and under what readability condition;
- `foreground_content_guidance`: how to layer real heading, body, CTA, and navigation content;
- `overlay_readability_guidance`: how to preserve contrast across animated frames and provide reduced-motion fallback;
- `pairing_guidance`: how to combine the record with the chosen base composition; and
- `selection_freedom`: the explicit no-quota policy;
- `enhancement_slot_policy`: advisory composition guidance, never a fixed number;
- `stacking_limit`: advisory simultaneous-runtime guidance, never a total-selection limit; and
- `runtime_budget_guidance`: how to lazy-load, pause, and separate heavy scenes.

Suggested discovery loop, which may be reordered or repeated:

1. Explore `selection_pass: "structure"` for useful page or section hierarchies.
2. Explore `selection_pass: "enhancement"` and any relevant linked sources for visual, motion, media, canvas, and WebGL opportunities.
3. Mix, replace, or revisit candidates from either group as the composition develops.
4. Use every compatible record that has a clear purpose; there is no required minimum, maximum, source coverage, or pass order.
5. Reject duplication that weakens the art direction. For expensive effects, budget simultaneous work: lazy-load scenes, pause them offscreen, cap DPR and postprocessing, and verify target devices. Multiple heavy scenes may exist on one page when separated and not needlessly active together.

## Rights

Kenney 3D and image packs in this catalog are user-provided distributions licensed CC0 1.0. Quaternius models are curated from official CC0 packs, converted to self-contained GLB files, and retain their official source records. Poly Haven models are CC0; any trademark warning remains marked concept-only. Component recipes are Lumora-owned original implementation briefs. React Bits and Canvas UI linked records use MIT + Commons Clause v1.0: use in commercial end projects is allowed, but resale or redistribution of the components themselves is restricted. pmndrs example code is MIT; visible demo models, textures, audio, fonts, logos, and imagery remain a separate per-item boundary and should be replaced unless independently confirmed. Arlan's Vault pages are explicitly marked MIT/free to copy; credited brand references and demo media remain separate boundaries and should be replaced during adaptation. Animated backgrounds remain externally hosted and are recorded as commercial-use based on Lumora's purchase and entitlement confirmation.

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

OriginKit records are external linked components with official remote previews and recommended discovery metadata. The MCP does not mirror OriginKit source code or media files.

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

These records expose official live demos, install commands, registry URLs, framework guidance, and remote selection previews. They are recommended discovery sources, not mandatory gates or quota-limited enhancement slots. Lumora does not mirror their source code or preview media.

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
- Multiple WebGL scenes are allowed when the concept benefits from them. Budget simultaneous cost: lazy-load them, cap DPR and postprocessing, pause them offscreen, dispose resources, and provide designed poster fallbacks. Avoid running competing heavy scenes in the same viewport unless the experience is intentionally immersive and tested.
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
- Use as many compatible treatments as the design earns. Respect reduced motion and touch input, pause continuous work offscreen, and assess competing canvas or WebGL scenes by simultaneous runtime and visual coherence rather than a fixed count.
<!-- ARLAN-VAULT:END -->
