const structureCategories = new Set([
  "buttons-controls",
  "cards-surfaces",
  "forms-status",
  "heroes-sections",
  "navigation",
]);

const ownedEnhancementFamilies = {
  backgrounds: "background / atmosphere",
  "data-3d": "3D / data visual",
  "pointer-media": "pointer / media treatment",
  "scroll-transitions": "scroll / transition",
  "text-effects": "text / typography treatment",
};

const hybridExternalCategories = new Set([
  "button",
  "components",
  "image-gallery",
  "interactive-elements",
  "mixed-dom-webgl",
  "portal-transition",
  "product-experience",
  "scroll-storytelling",
]);

const sectionCanvasExternalCategories = new Set([
  "signature-3d-scene",
]);

function isSectionCanvas(record) {
  const category = String(record.category ?? "").toLowerCase();
  const sourceCategory = String(
    record.source_category ?? "",
  ).toLowerCase();
  return (
    category === "backgrounds" ||
    category.includes("background") ||
    sourceCategory === "backgrounds" ||
    sourceCategory === "background-animation" ||
    sectionCanvasExternalCategories.has(sourceCategory)
  );
}

function externalFamily(record) {
  const category = String(
    record.source_category ?? record.category ?? "effect",
  )
    .replaceAll("-", " ")
    .replaceAll("/", " / ")
    .replace(/\s+/g, " ")
    .trim();
  return category || "effect / interaction";
}

export function componentSelectionProfile(record) {
  const external = record.source_kind === "external-linked-component";
  const structure = !external && structureCategories.has(record.category);
  const sectionCanvas = isSectionCanvas(record);
  const hybrid =
    external &&
    hybridExternalCategories.has(
      String(record.source_category ?? "").toLowerCase(),
    );

  if (structure) {
    return {
      selection_pass: "structure",
      selection_pass_label: "Structure / layout",
      component_role: "base-composition",
      enhancement_family: "layout / interface structure",
      required_review: false,
      recommended_review: false,
      can_be_structural: true,
      pairing_guidance:
        "Use this when it provides the right page or section hierarchy. Browse compatible effects from OriginKit, React Bits, Canvas UI, pmndrs Examples, Arlan's Vault, and Lumora when they could strengthen the result, and freely return to structural candidates as the design develops.",
      codex_selection_instruction:
        "Use this as a structural starting point, combine it with other compatible records, or replace it when a stronger composition emerges. The catalog imposes no component count or pass order.",
    };
  }

  const family = external
    ? externalFamily(record)
    : ownedEnhancementFamilies[record.category] ?? "effect / interaction";
  if (sectionCanvas) {
    return {
      selection_pass: "enhancement",
      selection_pass_label: "Effects / motion",
      component_role: "section-canvas",
      enhancement_family: "background / section canvas",
      required_review: false,
      recommended_review: external,
      can_be_structural: false,
      section_canvas: true,
      requires_structural_pairing: true,
      text_overlay_capability: "supported-with-contrast-audit",
      foreground_content_guidance:
        "Use this as the visual canvas behind a semantic hero or full-width section. Add real heading, body, CTA, and navigation content in a separate foreground layer; this background does not replace the content structure.",
      overlay_readability_guidance:
        "Test text contrast against the brightest and busiest animation frames. Add a brand-matched scrim, gradient, quiet zone, blur, or solid content panel when needed, and provide a static prefers-reduced-motion fallback.",
      pairing_guidance:
        "Pair this with any compatible hero or full-width section as its section-scale visual canvas. It may define the section's visual identity, but it must not replace semantic content, layout, or controls. Multiple section canvases may be used across a page when each serves a distinct section and the combined runtime cost is managed.",
      codex_selection_instruction: external
        ? `Available discovery source: ${record.source}. Treat this as a section-capable visual foundation, not only a small decorative effect. Use it alone, combine it with compatible records, repeat the technique where appropriate, or omit it; there is no catalog quota.`
        : "Treat this as a section-capable visual foundation. Pair it with any compatible hero or full-width section, combine it with other records when useful, or omit it; there is no signature-slot quota.",
    };
  }

  return {
    selection_pass: "enhancement",
    selection_pass_label: "Effects / motion",
    component_role: hybrid ? "hybrid-section-or-enhancement" : "enhancement",
    enhancement_family: family,
    required_review: false,
    recommended_review: external,
    can_be_structural: hybrid,
    pairing_guidance: hybrid
      ? "This may enhance an existing section, replace a structural section, or combine with other compatible records when its content and interaction contract are the stronger fit."
      : "Use this wherever it improves hierarchy, feedback, storytelling, comprehension, or brand character. It may be combined with other compatible records; avoid duplication because it weakens the design, not because of a catalog limit.",
    codex_selection_instruction: external
      ? `Available discovery source: ${record.source}. Use any compatible ideas from this record that improve the design, combine them with other records when useful, or omit them. The catalog does not limit the number of selected components.`
      : "Use this wherever it improves the design, combine it with other compatible records when useful, repeat it consistently when appropriate, or omit it. The catalog does not impose enhancement slots.",
  };
}

export function applyComponentSelectionGuidance(record) {
  const {
    section_canvas: _sectionCanvas,
    requires_structural_pairing: _requiresStructuralPairing,
    text_overlay_capability: _textOverlayCapability,
    foreground_content_guidance: _foregroundContentGuidance,
    overlay_readability_guidance: _overlayReadabilityGuidance,
    ...baseRecord
  } = record;
  return {
    ...baseRecord,
    ...componentSelectionProfile(baseRecord),
    selection_freedom:
      "Advisory library, not a quota system. Codex may use, combine, adapt, repeat, or omit any number of records from any source when they fit the page goal and art direction.",
    enhancement_slot_policy:
      "No fixed component or enhancement quota. Start with a coherent set, then add every additional treatment that has a clear purpose and remains visually compatible.",
    stacking_limit:
      "Advisory runtime budget, not a count limit. Multiple lightweight effects and multiple section backgrounds are allowed; lazy-load and pause heavy scenes so only the relevant work stays active, and test the combined result.",
    runtime_budget_guidance:
      "Judge simultaneous cost rather than total selections. Multiple heavy scenes may exist on one page when separated by section, lazy-loaded, paused offscreen, given static fallbacks, and verified on target devices.",
  };
}
