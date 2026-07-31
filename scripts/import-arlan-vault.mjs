import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { applyComponentSelectionGuidance } from "./component-selection-guidance.mjs";

const repoRoot = path.resolve(process.cwd());
const mcpRoot = path.join(repoRoot, "mcp");
const snapshotPath = path.join(mcpRoot, "arlan-vault.json");
const publicRoot = "https://lumoraofficial.de/mcp";
const sourceName = "Arlan's Vault";
const sourceUrl = "https://www.arlan.me/vault";
const creator = "Arlan Marat";
const inventoryDate = "2026-07-31";
const phase = "arlan-vault-linked-2026-07";
const refresh = process.argv.includes("--refresh");

const entries = [
  {
    slug: "fade-motion",
    name: "Fade motion",
    category: "WebGL text treatment",
    sourceCategory: "text-effects",
    summary:
      "A word trails into light through a GPU accumulation effect that replaces hundreds of overlapping text draws with one fixed-cost WebGL pass.",
    technique:
      "Render a text mask, march backward through its trail in a fragment shader, then layer depth, chromatic dispersion, turbulence, grain, and pointer-responsive bending.",
    tags: ["WebGL", "GLSL", "typography", "trail", "chromatic", "pointer"],
    bestFor:
      "campaign headlines; launch heroes; cinematic title cards; premium portfolio transitions",
    motion: "strong",
    performance: "high",
    impact: "signature",
    quality: 94,
    novelty: 95,
    accent: "#D99658",
    publishedAt: "2026-07-28",
    dependencies: "React; WebGL1 / GLSL; inspect the current official code tabs",
    featured: true,
  },
  {
    slug: "liquid-ui",
    name: "Liquid UI",
    category: "Liquid layout / card system",
    sourceCategory: "interactive-elements",
    summary:
      "A small geometry engine joins adjacent cards with reflowing concave corners, ranging from crisp modular joints to soft fused blobs.",
    technique:
      "Derive the shared boundary between neighboring cards and redraw the joining path as cards move or the corner-softness value changes.",
    tags: ["cards", "layout", "liquid", "geometry", "drag", "responsive"],
    bestFor:
      "modular product stories; connected dashboards; spatial feature groups; playful editorial sections",
    motion: "medium",
    performance: "medium",
    impact: "supporting",
    quality: 92,
    novelty: 94,
    accent: "#A8B9D4",
    publishedAt: "2026-07-27",
    dependencies: "React / TypeScript; inspect the current official implementation",
    featured: true,
  },
  {
    slug: "kinetic-typography",
    name: "Kinetic typography",
    category: "Kinetic text effect",
    sourceCategory: "text-effects",
    summary:
      "A letter is divided into tiles whose independent wave offsets make the glyph ripple like a flexible surface.",
    technique:
      "Cut a display glyph into a grid, preserve the original glyph mask in every tile, and offset the tiles along a spatially phased wave.",
    tags: ["typography", "tiles", "wave", "display text", "kinetic"],
    bestFor:
      "single-letter brand moments; editorial chapter markers; art and culture campaigns; motion studies",
    motion: "strong",
    performance: "medium",
    impact: "supporting",
    quality: 90,
    novelty: 92,
    accent: "#242424",
    publishedAt: "2026-07-25",
    dependencies: "React / TypeScript; inspect the current official implementation",
    featured: true,
  },
  {
    slug: "squircle",
    name: "Apple's corners",
    category: "Button geometry",
    sourceCategory: "buttons-controls",
    summary:
      "A live button demonstrates continuous squircle corners that ease into straight edges more smoothly than an ordinary CSS border radius.",
    technique:
      "Use a superellipse-style corner path or mask for continuous curvature, then keep the semantic button and its focus ring independent of the decorative shape.",
    tags: ["squircle", "button", "superellipse", "corners", "micro UI"],
    bestFor:
      "premium controls; mobile-inspired UI; compact calls to action; polished app chrome",
    motion: "subtle",
    performance: "low",
    impact: "subtle",
    quality: 91,
    novelty: 82,
    accent: "#BABABA",
    publishedAt: "2026-07-21",
    dependencies: "CSS / SVG geometry; inspect the current official implementation",
  },
  {
    slug: "ransom-note",
    name: "Ransom note",
    category: "Expressive text system",
    sourceCategory: "text-effects",
    summary:
      "Typed text is rebuilt from torn-paper letter variants with controlled random tilt, scale, bounce, and re-rolling.",
    technique:
      "Map characters to a small letter-image inventory, seed the variation so layout remains stable, and expose restrained controls for rotation, scale, spacing, and reveal timing.",
    tags: ["typography", "collage", "cutout letters", "editorial", "randomized"],
    bestFor:
      "music and fashion campaigns; editorial headlines; youth culture; intentionally handmade brand moments",
    motion: "medium",
    performance: "medium",
    impact: "supporting",
    quality: 90,
    novelty: 91,
    accent: "#D44B53",
    publishedAt: "2026-07-16",
    dependencies: "React; image assets; inspect the current official implementation",
    assetNote:
      "The letter-image set is part of the official demo surface. Keep its source record with the implementation or replace it with project-owned cutouts for a new art direction.",
  },
  {
    slug: "chroma-glow",
    name: "Chromatic glow",
    category: "Luminous text treatment",
    sourceCategory: "text-effects",
    summary:
      "Layered text blurs create a true bloom while warm and cool copies separate toward the cursor to form a responsive chromatic edge.",
    technique:
      "Stack blurred text copies at several radii, add opposing warm and cool offsets, and drive only the small separation vector from pointer position.",
    tags: ["typography", "glow", "chromatic aberration", "blur", "pointer"],
    bestFor:
      "nightlife campaigns; entertainment; creative technology; compact hero accents",
    motion: "medium",
    performance: "medium",
    impact: "supporting",
    quality: 92,
    novelty: 88,
    accent: "#8C63FF",
    publishedAt: "2026-07-14",
    dependencies: "CSS filters / React; inspect the current official implementation",
    featured: true,
  },
  {
    slug: "emboss",
    name: "Realistic emboss",
    category: "Material text treatment",
    sourceCategory: "text-effects",
    summary:
      "Text or SVG artwork is pressed into a configurable surface using layered light, shadow, depth, and material presets.",
    technique:
      "Combine inset highlights, directional shadows, surface color, and a masked text or SVG layer so the mark reads as physically raised or debossed.",
    tags: ["emboss", "deboss", "material", "typography", "SVG", "surface"],
    bestFor:
      "luxury packaging; tactile brand marks; editorial title plates; restrained product storytelling",
    motion: "subtle",
    performance: "low",
    impact: "supporting",
    quality: 93,
    novelty: 89,
    accent: "#D7C7F7",
    publishedAt: "2026-07-13",
    dependencies: "CSS / SVG; inspect the current official implementation",
    featured: true,
  },
  {
    slug: "typer",
    name: "The typer",
    category: "Headline reveal",
    sourceCategory: "text-effects",
    summary:
      "A wave types through a headline while neighboring characters temporarily merge into solid, highlighted, and outlined pill states before resolving to text.",
    technique:
      "Keep the full headline available to assistive technology, animate only an aria-hidden duplicate, and merge adjacent characters that share the same transient state.",
    tags: ["typography", "reveal", "headline", "pills", "wave", "state"],
    bestFor:
      "product launches; creative portfolios; section introductions; technical headlines",
    motion: "medium",
    performance: "low",
    impact: "supporting",
    quality: 93,
    novelty: 94,
    accent: "#FF7A18",
    publishedAt: "2026-07-07",
    dependencies: "React / CSS; inspect the current official implementation",
    featured: true,
  },
  {
    slug: "color-depth",
    name: "The art of color depth",
    category: "Dimensional button system",
    sourceCategory: "buttons-controls",
    summary:
      "Ten button treatments build convincing glass, metal, gloss, and cushion depth from gradients, inset shadows, highlights, and controlled color layering.",
    technique:
      "Layer a gradient body, inset bevels, a top-edge reflection, hover light, and restrained exterior shadow while keeping the button's semantic and focus behavior intact.",
    tags: ["button", "depth", "glass", "metal", "gloss", "CSS"],
    bestFor:
      "primary calls to action; premium product UI; tactile controls; material-led design systems",
    motion: "subtle",
    performance: "low",
    impact: "subtle",
    quality: 94,
    novelty: 87,
    accent: "#A948FF",
    publishedAt: "2026-07-02",
    dependencies: "CSS; inspect the current official implementation",
    featured: true,
  },
  {
    slug: "ghosty-reveal",
    name: "Ghosty reveal",
    category: "Image reveal / gallery",
    sourceCategory: "image-gallery",
    summary:
      "Images bleed into view through a soft cloudy mask instead of a hard clip or ordinary opacity fade.",
    technique:
      "Move an oversized feathered CSS mask across each image, varying direction, softness, duration, and easing while preserving the image beneath.",
    tags: ["image", "gallery", "mask", "reveal", "scroll", "soft"],
    bestFor:
      "photography stories; editorial galleries; fashion and hospitality; cinematic case studies",
    motion: "medium",
    performance: "low",
    impact: "supporting",
    quality: 92,
    novelty: 86,
    accent: "#8A93A4",
    publishedAt: "2026-06-29",
    dependencies: "CSS masks / React; inspect the current official implementation",
    assetNote:
      "The demo photographs are selection content, not a default client asset pack. Use project-owned or separately sourced imagery in production.",
  },
  {
    slug: "sandbox",
    previewSlug: "symbols-effect",
    name: "Symbols effect",
    category: "GPU media background",
    sourceCategory: "backgrounds",
    summary:
      "An image or live video is rebuilt on the GPU from configurable symbols, four luminance bands, and an independent color system.",
    technique:
      "Sample media luminance in a fragment shader, quantize it into bands, stamp a chosen glyph atlas per cell, and expose band thresholds and colors as brand controls.",
    tags: ["WebGL", "GPU", "video", "image", "symbols", "ASCII", "shader"],
    bestFor:
      "experimental heroes; media launches; event identities; technical campaign sections",
    motion: "strong",
    performance: "high",
    impact: "signature",
    quality: 93,
    novelty: 94,
    accent: "#E65850",
    publishedAt: "2026-06-28",
    dependencies: "WebGL / GLSL; React; inspect the current official implementation",
    featured: true,
  },
  {
    slug: "dia-gradient",
    name: "Dia Browser's gradient",
    category: "Ambient background",
    sourceCategory: "backgrounds",
    summary:
      "A row of blurred SVG color bars rises from the bottom edge into a soft, curved atmospheric glow.",
    technique:
      "Paint several vertical bars with one multicolor SVG gradient, vary their heights across a curve, blur the group, and reveal it with a bottom-origin scale transform.",
    tags: ["background", "SVG", "gradient", "glow", "ambient", "entrance"],
    bestFor:
      "product heroes; dark interfaces; launch pages; quiet section transitions",
    motion: "medium",
    performance: "medium",
    impact: "supporting",
    quality: 90,
    novelty: 84,
    accent: "#B552FF",
    publishedAt: "2026-06-26",
    dependencies: "SVG / CSS; inspect the current official implementation",
    brandNote:
      "The page credits Dia Browser as the reference. Reuse the construction technique with an original palette, silhouette, timing, and composition.",
  },
  {
    slug: "vector-editor",
    name: "Figma vector editor",
    category: "Interactive product interface",
    sourceCategory: "interactive-elements",
    summary:
      "A selection frame and compact SVG path editor provide draggable Bézier handles, dimensions, points, and serialized path output.",
    technique:
      "Parse supported SVG path commands into anchors and control handles, render accessible editor controls around the SVG, and serialize changes back to path data.",
    tags: ["SVG", "Bezier", "editor", "handles", "product UI", "drag"],
    bestFor:
      "creative tools; interactive product demos; diagram editors; technical portfolio sections",
    motion: "medium",
    performance: "medium",
    impact: "supporting",
    quality: 91,
    novelty: 92,
    accent: "#0D99FF",
    publishedAt: "2026-06-25",
    dependencies: "React / TypeScript / SVG; inspect the current official implementation",
    brandNote:
      "The interaction references Figma's editor language. Adapt the controls and visual system to the client rather than reproducing Figma branding or an exact product composition.",
  },
  {
    slug: "amo",
    previewSlug: "amo-hover-button",
    name: "Amo hover button",
    category: "Video-enhanced button",
    sourceCategory: "buttons-controls",
    summary:
      "A semantic pill button reveals a short transparent or keyed video on hover or tap, with optional reverse playback, magnetism, and a static reduced-motion state.",
    technique:
      "Keep the semantic button as the base, layer a tiny forward/reverse video source set over it, align the reverse clip to the current forward time, and disable decorative playback for reduced motion.",
    tags: ["button", "video", "hover", "touch", "transparent media", "magnetic"],
    bestFor:
      "playful calls to action; campaign microsites; entertainment; small memorable conversion moments",
    motion: "strong",
    performance: "medium",
    impact: "supporting",
    quality: 91,
    novelty: 93,
    accent: "#EEEAE4",
    publishedAt: "2026-06-23",
    dependencies: "React; optimized WebM / HEVC or MP4 clips; inspect the current official implementation",
    assetNote:
      "The demo video clips and Amo reference are examples. Generate or supply original client-owned clips and posters before production use.",
    brandNote:
      "The page credits Amo as the reference. Preserve the interaction principle while replacing the label, clips, palette, sound, and motion character.",
  },
  {
    slug: "midjourney",
    previewSlug: "midjourney-ascii",
    name: "Midjourney Medical's ASCII",
    category: "Canvas typography background",
    sourceCategory: "backgrounds",
    summary:
      "Thousands of cached text glyphs orbit on one canvas, gradually resolve into a wordmark, and receive a restrained CRT post-treatment.",
    technique:
      "Cache glyph renders, reuse them across a polar particle field, modulate angular velocity by radius, morph selected glyphs toward a target word, and finish with subtle scanline, vignette, curve, and color-split passes.",
    tags: ["canvas", "ASCII", "typography", "particles", "CRT", "wordmark"],
    bestFor:
      "technology heroes; AI and data storytelling; editorial mastheads; cinematic launch sections",
    motion: "strong",
    performance: "high",
    impact: "signature",
    quality: 94,
    novelty: 95,
    accent: "#C0A354",
    publishedAt: "2026-06-19",
    dependencies: "Canvas 2D; React; inspect the current official implementation",
    featured: true,
    brandNote:
      "The demo reconstructs Midjourney Medical's branded composition. Use the canvas and glyph-morph technique with original project copy, palette, layout, and identity assets.",
  },
];

const defaultAccessibility =
  "Keep the real text, image, link, button, or control as semantic HTML. Treat duplicated visual layers and canvases as decorative, preserve visible focus and keyboard order, and provide touch behavior for hover or pointer input.";
const defaultResponsive =
  "Retune scale, density, crop, and pointer dependence for narrow screens. Keep the underlying content usable on coarse pointers and avoid clipping display text or controls.";
const defaultFallback =
  "Show a composed static state when reduced motion is requested, the enhancement is offscreen, initialization fails, or the device cannot sustain the effect.";

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html",
      "User-Agent": "Lumora-MCP-Arlan-Vault-Importer/1.0",
    },
  });
  if (!response.ok) throw new Error(`Request failed (${response.status}): ${url}`);
  return response.text();
}

function toIndexRecord(record) {
  const fields = [
    "id",
    "name",
    "category",
    "source_category",
    "art_direction",
    "summary",
    "style_tags",
    "best_for",
    "framework_fit",
    "motion_level",
    "performance_cost",
    "impact",
    "quality_score",
    "novelty_score",
    "compatibility",
    "source_kind",
    "license",
    "source",
    "source_url",
    "official_source_url",
    "code_url",
    "preview_video_url",
    "preview_poster_url",
    "public_preview_poster_url",
    "preview_accent",
    "official_featured",
    "official_source_label",
    "implementation_mode",
    "phase",
    "selection_pass",
    "selection_pass_label",
    "component_role",
    "enhancement_family",
    "can_be_structural",
    "section_canvas",
    "requires_structural_pairing",
    "text_overlay_capability",
    "foreground_content_guidance",
    "overlay_readability_guidance",
    "pairing_guidance",
    "codex_selection_instruction",
    "codex_rights_instruction",
    "selection_freedom",
  ];
  return Object.fromEntries(fields.map((field) => [field, record[field]]));
}

function recordFromEntry(entry, sourceSnapshotHash) {
  const detailUrl = `${sourceUrl}/${entry.slug}`;
  const previewSlug = entry.previewSlug ?? entry.slug;
  const previewPath = `assets/component-previews/arlan-vault/${previewSlug}.webp`;
  const sectionCanvas = entry.sourceCategory === "backgrounds";
  const record = {
    id: `arlan-vault-${entry.slug}`,
    name: entry.name,
    category: entry.category,
    source_category: entry.sourceCategory,
    art_direction: sourceName,
    summary: entry.summary,
    technique: entry.technique,
    style_tags: [...entry.tags, "Arlan's Vault", "design engineering"].join("; "),
    best_for: entry.bestFor,
    dependencies: entry.dependencies,
    framework_fit:
      "Official examples are published as copyable web/React implementations; port the isolated technique to the target project's framework and conventions.",
    motion_level: entry.motion,
    motion_choreography:
      "Preserve the core behavior, then retime its entrance, response, and rest state to the brand. Stop decorative motion once attention has landed and pause continuous work offscreen.",
    performance_cost: entry.performance,
    accessibility_contract: sectionCanvas
      ? `${defaultAccessibility} Keep all essential hero or section content in a separate semantic foreground layer outside the canvas or visual effect.`
      : defaultAccessibility,
    content_contract:
      "Replace demo copy, logos, imagery, and media with real project content. Do not use the experiment as a substitute for information hierarchy or product behavior.",
    responsive_strategy: entry.sourceCategory === "backgrounds"
      ? `${defaultResponsive} Reduce canvas resolution, glyph count, blur, or shader work on mobile and provide a quiet area behind foreground text.`
      : defaultResponsive,
    interaction_inputs:
      "Inspect the official page for pointer, hover, drag, scroll, touch, keyboard, ambient, and editable inputs before adapting the selected experiment.",
    fallback_strategy: defaultFallback,
    test_focus:
      "official source review; semantic content; keyboard; touch/coarse pointer; reduced motion; narrow viewport; offscreen pause; cleanup; loading and fallback state",
    implementation_steps:
      "open the official detail page; inspect its live demo and code tabs; isolate the technique; replace demo content and assets; map brand tokens; add accessible and reduced-motion fallbacks; profile and test",
    brand_tokens:
      "Map type, surface, color, blur, depth, scale, geometry, timing, media, and interaction strength to the project's semantic tokens.",
    avoid_when:
      "the treatment competes with conversion or reading, repeats another enhancement, relies on hover for essential meaning, or cannot meet the page's motion and performance budget",
    impact: entry.impact,
    quality_score: entry.quality,
    novelty_score: entry.novelty,
    compatibility: "Modern browsers; official web/React implementation",
    source_kind: "external-linked-component",
    license: "MIT (official Vault page)",
    licence_class: "bundle-ok-code-linked-assets",
    usage_rights:
      "The official Vault collection and each published detail page state ‘MIT → free to copy’. Adapt the selected implementation while retaining creator, source, and licence provenance.",
    license_notice_required: true,
    license_url: "https://opensource.org/licenses/MIT",
    asset_rights_boundary:
      entry.assetNote ??
      "The page marks its published experiment MIT/free to copy. Replace recognizable third-party brand material, upstream reference compositions, and any client-specific media with approved project assets.",
    codex_rights_instruction:
      "Use the implementation under the MIT statement on the official Vault page and keep its creator/source record. Treat credited brands, upstream references, photographs, generated clips, fonts, and other demo media as a separate asset boundary and replace them when adapting the technique.",
    brand_or_trademark_note: entry.brandNote ?? null,
    source: sourceName,
    creator,
    source_url: detailUrl,
    official_source_url: detailUrl,
    official_source_label: "Open live Vault experiment and code",
    code_url: detailUrl,
    repository_url: null,
    preview_video_url: null,
    preview_poster_url: previewPath,
    public_preview_poster_url: `${publicRoot}/${previewPath}`,
    preview_accent: entry.accent,
    preview_layout: "full",
    preview_fallback: "local-live-card-capture",
    preview_capture_source_url: sourceUrl,
    preview_capture_date: inventoryDate,
    preview_rights:
      "Selection screenshot captured from the official Vault card on a collection explicitly marked MIT/free to copy; do not ship it as production website media.",
    remote_media: false,
    media_mirrored: true,
    source_code_bundled: false,
    implementation_mode: "copy-selected-code-from-official-page",
    install_command: null,
    registry_url: null,
    official_featured: Boolean(entry.featured),
    official_variants: ["Live web demo", "Copyable code", "Copy prompt"],
    published_at: entry.publishedAt,
    inventory_date: inventoryDate,
    source_revision: sourceSnapshotHash,
    phase,
    public_record_url: `${publicRoot}/components.json#arlan-vault-${entry.slug}`,
  };
  return applyComponentSelectionGuidance(record);
}

async function buildSnapshot() {
  const pageRecords = await Promise.all(
    entries.map(async (entry) => {
      const url = `${sourceUrl}/${entry.slug}`;
      const html = await fetchPage(url);
      if (!/opensource\.org\/licenses\/MIT/i.test(html)) {
        throw new Error(`MIT link is missing from ${url}`);
      }
      const observedTitle = html.match(/<title>(.*?)<\/title>/i)?.[1] ?? null;
      return { entry, html, observedTitle };
    }),
  );
  const sourceSnapshotHash = createHash("sha256")
    .update(pageRecords.map(({ entry, html }) => `${entry.slug}\n${html}`).join("\n"))
    .digest("hex");
  const records = pageRecords.map(({ entry, observedTitle }) => ({
    ...recordFromEntry(entry, sourceSnapshotHash),
    observed_title: observedTitle,
  }));
  return {
    source: sourceName,
    sourceUrl,
    creator,
    inventoryDate,
    sourceSnapshotHash,
    license: "MIT",
    licenseUrl: "https://opensource.org/licenses/MIT",
    licenseStatement: "MIT → free to copy",
    selectionMethod:
      "All currently published Vault experiments with dedicated detail/code pages were included. Prompt-only gallery sketches without a stable detail page were excluded until their implementation is published.",
    excludedFamilies: [
      "prompt-only gallery sketches without dedicated implementation pages",
      "coming-soon placeholders",
    ],
    previewMethod:
      "Static WebP selection previews captured from the live official Vault cards; source code and heavy demo media remain linked rather than mirrored.",
    recordCount: records.length,
    records,
  };
}

async function loadOrRefreshSnapshot() {
  const snapshot =
    refresh || !(await exists(snapshotPath))
      ? await buildSnapshot()
      : JSON.parse(await readFile(snapshotPath, "utf8"));
  snapshot.records = snapshot.records.map(applyComponentSelectionGuidance);
  await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  return snapshot;
}

function replaceMarkdownBlock(source, start, end, content) {
  const block = `${start}\n${content.trim()}\n${end}`;
  const pattern = new RegExp(
    `${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
  );
  return pattern.test(source)
    ? source.replace(pattern, block)
    : `${source.trimEnd()}\n\n${block}\n`;
}

async function updateInstructions(snapshot) {
  const filePath = path.join(mcpRoot, "instructions.md");
  let instructions = await readFile(filePath, "utf8");
  if (!instructions.includes(`${publicRoot}/arlan-vault.json`)) {
    instructions = instructions.replace(
      `- pmndrs R3F / WebGL snapshot: ${publicRoot}/pmndrs-examples.json`,
      `- pmndrs R3F / WebGL snapshot: ${publicRoot}/pmndrs-examples.json\n- Arlan's Vault snapshot: ${publicRoot}/arlan-vault.json`,
    );
  }
  instructions = instructions
    .replaceAll(
      "OriginKit, React Bits, Canvas UI, and pmndrs Examples",
      "OriginKit, React Bits, Canvas UI, pmndrs Examples, and Arlan's Vault",
    )
    .replaceAll(
      "OriginKit, React Bits, Canvas UI, pmndrs Examples, and Lumora-owned",
      "OriginKit, React Bits, Canvas UI, pmndrs Examples, Arlan's Vault, and Lumora-owned",
    );
  const content = `
## Arlan's Vault linked design-engineering experiments

These ${snapshot.recordCount} records cover every currently published Vault experiment with a dedicated live demo and code page. The collection is especially useful for typography, material depth, buttons, image reveals, canvas/GPU media treatments, and compact interaction ideas.

- Filter \`art_direction: "Arlan's Vault"\` whenever its techniques fit, and freely combine any compatible candidates with other sources.
- Use \`official_source_url\` to inspect the live behavior and \`code_url\` to reach the implementation section. Copy only the selected experiment.
- Most records are effects, but Liquid UI, Ghosty reveal, and the vector editor can also carry structural sections or product widgets when their content contracts fit. Symbols effect, Dia gradient, and Midjourney Medical's ASCII are section canvases that still need semantic foreground content.
- The official collection and detail pages state \`MIT → free to copy\`. Preserve the creator/source record and the licence notice.
- Credited brand references and demo media remain a separate boundary. Adapt the interaction principle with original project copy, imagery, video, palette, and identity assets.
- Local WebP files are selection previews captured from the live official cards. They are not production website assets.
- Codex may use and combine any number of treatments. Reduced motion, touch input, offscreen pausing, and cleanup remain implementation responsibilities, never usage limits.
`;
  instructions = replaceMarkdownBlock(
    instructions,
    "<!-- ARLAN-VAULT:START -->",
    "<!-- ARLAN-VAULT:END -->",
    content,
  );
  await writeFile(filePath, instructions);
}

async function writeLicenseBoundary(snapshot) {
  await mkdir(path.join(mcpRoot, "licences"), { recursive: true });
  const notice = [
    "Arlan's Vault linked implementation and preview boundary",
    `Inventory date: ${snapshot.inventoryDate}`,
    `Creator: ${snapshot.creator}`,
    `Official collection: ${snapshot.sourceUrl}`,
    `Observed source snapshot SHA-256: ${snapshot.sourceSnapshotHash}`,
    `Official page statement: ${snapshot.licenseStatement}`,
    `Licence link used by the official pages: ${snapshot.licenseUrl}`,
    "",
    "Lumora MCP stores curated metadata and small WebP selection screenshots",
    "captured from the official live cards. It does not mirror the implementation",
    "source or heavy demo media. Open the selected official detail page for code.",
    "",
    "Keep Arlan Marat, the exact page URL, and the MIT notice with adaptations.",
    "Credited brands, upstream reference compositions, photographs, fonts, audio,",
    "generated video clips, and other demo media may have separate rights. Replace",
    "those materials with approved project assets when the record says to do so.",
    "",
  ].join("\n");
  await writeFile(path.join(mcpRoot, "licences", "arlan-vault.txt"), notice);
}

async function mergeCatalog(snapshot) {
  const componentsPath = path.join(mcpRoot, "components.json");
  const indexPath = path.join(mcpRoot, "components-index.json");
  const components = JSON.parse(await readFile(componentsPath, "utf8"));
  const merged = [
    ...components.filter((record) => record.phase !== phase),
    ...snapshot.records,
  ].map(applyComponentSelectionGuidance);
  const ownedCount = merged.filter(
    (record) => record.source_kind === "owned-original-recipe",
  ).length;
  const sourceCount = (name) =>
    merged.filter((record) => record.source === name).length;
  const sectionCanvasCount = merged.filter(
    (record) => record.section_canvas === true,
  ).length;
  await writeFile(componentsPath, `${JSON.stringify(merged, null, 2)}\n`);
  await writeFile(
    indexPath,
    `${JSON.stringify(merged.map(toIndexRecord), null, 2)}\n`,
  );

  const manifestPath = path.join(mcpRoot, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.version = "1.6.0";
  manifest.generatedAt = inventoryDate;
  manifest.purpose =
    "A human and machine-readable design toolkit for selecting web-ready 3D models, owned-original and officially linked web components, design-engineering experiments, curated R3F/WebGL patterns, multi-style image and UI assets, and externally hosted animated background references.";
  manifest.totals.componentRecipes = merged.length;
  manifest.totals.ownedComponentRecipes = ownedCount;
  manifest.totals.linkedComponentRecipes = merged.length - ownedCount;
  manifest.totals.linkedOriginKitComponents = sourceCount("OriginKit");
  manifest.totals.linkedReactBitsComponents = sourceCount("React Bits");
  manifest.totals.linkedCanvasUiComponents = sourceCount("Canvas UI");
  manifest.totals.linkedPmndrsExamples = sourceCount("pmndrs Examples");
  manifest.totals.linkedArlanVaultComponents = snapshot.recordCount;
  manifest.totals.structureComponentRecipes = merged.filter(
    (record) => record.selection_pass === "structure",
  ).length;
  manifest.totals.enhancementComponentRecipes = merged.filter(
    (record) => record.selection_pass === "enhancement",
  ).length;
  manifest.totals.sectionCanvasComponentRecipes = sectionCanvasCount;
  manifest.endpoints.arlanVault = `${publicRoot}/arlan-vault.json`;
  manifest.componentSchema = {
    ...manifest.componentSchema,
    publicPreviewPosterUrl:
      "Absolute URL for a linked record's optimized local selection preview",
    previewCaptureSourceUrl:
      "Official page from which a local selection preview was captured",
  };
  manifest.componentSelectionGuidance = {
    ...manifest.componentSelectionGuidance,
    arlanVault:
      "Arlan's Vault records are compact MIT-marked design-engineering experiments. Review them for typography, material, button, reveal, canvas, and GPU treatments; copy only the selected implementation and replace credited brand/demo media.",
    selectionFreedom:
      "UNRESTRICTED: Codex alone decides all record counts, combinations, placement, repetition, sources, and selection order. Lumora imposes no usage rules.",
    linkedSourceBoundary:
      "React Bits and Canvas UI allow commercial end-project use under their recorded terms. pmndrs example code and Arlan's Vault implementations are MIT-marked; visible demo assets and credited brand references remain separate boundaries.",
  };
  delete manifest.componentSelectionGuidance.mandatoryEnhancementReview;
  delete manifest.componentSelectionGuidance.enhancementDiscovery;
  delete manifest.componentSelectionGuidance.sourceCoverageRule;
  delete manifest.componentSelectionGuidance.stackingRule;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const provenancePath = path.join(mcpRoot, "provenance.json");
  const provenance = JSON.parse(await readFile(provenancePath, "utf8"));
  provenance.generatedAt = inventoryDate;
  const previous = provenance.components;
  provenance.components = {
    ...previous,
    source:
      "Lumora owned-original recipes plus officially linked OriginKit, React Bits, Canvas UI, pmndrs Examples, and Arlan's Vault catalogs",
    licence:
      "Owned-original; OriginKit user-confirmed free use; React Bits and Canvas UI MIT + Commons Clause v1.0; pmndrs example code MIT; Arlan's Vault pages explicitly marked MIT/free to copy; linked demo-asset boundaries preserved",
    recipeCount: merged.length,
    ownedOriginalCount: ownedCount,
    linkedComponentCount: merged.length - ownedCount,
    linkedOriginKitCount: sourceCount("OriginKit"),
    linkedReactBitsCount: sourceCount("React Bits"),
    linkedCanvasUiCount: sourceCount("Canvas UI"),
    linkedPmndrsCount: sourceCount("pmndrs Examples"),
    linkedArlanVaultCount: snapshot.recordCount,
    structureCount: manifest.totals.structureComponentRecipes,
    enhancementCount: manifest.totals.enhancementComponentRecipes,
    sectionCanvasCount,
    sources: [
      ...previous.sources.filter((entry) => entry.source !== sourceName),
      {
        source: sourceName,
        sourceUrl: snapshot.sourceUrl,
        creator: snapshot.creator,
        sourceSnapshotHash: snapshot.sourceSnapshotHash,
        sourceKind: "external-linked-component",
        licence: snapshot.license,
        licenceUrl: snapshot.licenseUrl,
        licenceStatement: snapshot.licenseStatement,
        recordCount: snapshot.recordCount,
        inventoryDate: snapshot.inventoryDate,
        storage:
          "Curated metadata plus 15 optimized local selection screenshots; implementation code and heavy demo media remain linked at the official detail pages.",
        assetBoundary:
          "The official experiment pages are marked MIT/free to copy. Credited brand references and demo images, video, fonts, audio, and identity assets are replaced when adapting a selected technique.",
      },
    ],
    transformations: [
      ...previous.transformations.filter(
        (entry) =>
          !/Arlan's Vault|Vault experiments|live Vault cards|MIT-marked implementation reuse/i.test(
            entry,
          ),
      ),
      "Curated every currently published Arlan's Vault experiment with a stable detail/code page and classified each as a typography, material, button, image, interface, canvas, or GPU treatment.",
      "Captured and optimized 15 accurate static selection previews from the live Vault cards while leaving implementation source and heavy demo media at the official pages.",
      "Separated MIT-marked implementation reuse from credited brands, upstream reference compositions, and replaceable demo media.",
    ],
  };
  await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);
}

const snapshot = await loadOrRefreshSnapshot();
await updateInstructions(snapshot);
await writeLicenseBoundary(snapshot);
await mergeCatalog(snapshot);

console.log(
  JSON.stringify(
    {
      source: snapshot.source,
      sourceSnapshotHash: snapshot.sourceSnapshotHash,
      records: snapshot.recordCount,
      categories: Object.fromEntries(
        [...new Set(entries.map((entry) => entry.category))].map((category) => [
          category,
          entries.filter((entry) => entry.category === category).length,
        ]),
      ),
    },
    null,
    2,
  ),
);
