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
      can_be_structural: true,
      pairing_guidance:
        "This record can provide page or section hierarchy and can be combined with any other catalog records.",
      codex_selection_instruction:
        "Codex has complete freedom to use, combine, adapt, repeat, or replace this record in any quantity and at any point in the design process.",
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
      can_be_structural: false,
      section_canvas: true,
      requires_structural_pairing: true,
      text_overlay_capability: "supported-with-contrast-audit",
      foreground_content_guidance:
        "Use this as the visual canvas behind a semantic hero or full-width section. Add real heading, body, CTA, and navigation content in a separate foreground layer; this background does not replace the content structure.",
      overlay_readability_guidance:
        "Test text contrast against the brightest and busiest animation frames. Add a brand-matched scrim, gradient, quiet zone, blur, or solid content panel when needed, and provide a static prefers-reduced-motion fallback.",
      pairing_guidance:
        "This can act as a section-scale visual canvas behind semantic content and can be combined or repeated with any other catalog records.",
      codex_selection_instruction: external
        ? `Available source: ${record.source}. Codex has complete freedom to use, combine, adapt, repeat, or replace this section-capable visual in any quantity.`
        : "Codex has complete freedom to use, combine, adapt, repeat, or replace this section-capable visual in any quantity.",
    };
  }

  return {
    selection_pass: "enhancement",
    selection_pass_label: "Effects / motion",
    component_role: hybrid ? "hybrid-section-or-enhancement" : "enhancement",
    enhancement_family: family,
    can_be_structural: hybrid,
    pairing_guidance: hybrid
      ? "This can enhance an existing section, define a structural section, or combine with any other catalog records."
      : "This can be used alone, combined with any other records, or repeated wherever Codex chooses.",
    codex_selection_instruction: external
      ? `Available source: ${record.source}. Codex has complete freedom to use, combine, adapt, repeat, or replace this record in any quantity.`
      : "Codex has complete freedom to use, combine, adapt, repeat, or replace this record in any quantity.",
  };
}

export function applyComponentSelectionGuidance(record) {
  const {
    section_canvas: _sectionCanvas,
    requires_structural_pairing: _requiresStructuralPairing,
    text_overlay_capability: _textOverlayCapability,
    foreground_content_guidance: _foregroundContentGuidance,
    overlay_readability_guidance: _overlayReadabilityGuidance,
    required_review: _requiredReview,
    recommended_review: _recommendedReview,
    enhancement_slot_policy: _enhancementSlotPolicy,
    stacking_limit: _stackingLimit,
    runtime_budget_guidance: _runtimeBudgetGuidance,
    ...baseRecord
  } = record;
  return {
    ...baseRecord,
    ...componentSelectionProfile(baseRecord),
    selection_freedom:
      "UNRESTRICTED: Codex alone decides how many records to use, how to combine them, where to place them, and whether to repeat them. Lumora defines no minimum, maximum, default count, stacking rule, preferred starting point, source quota, or selection order.",
  };
}
