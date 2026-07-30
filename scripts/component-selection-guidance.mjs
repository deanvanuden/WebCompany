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
    sourceCategory === "background-animation"
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
      selection_pass_label: "Pass 1 · Structure / layout",
      component_role: "base-composition",
      enhancement_family: "layout / interface structure",
      required_review: false,
      can_be_structural: true,
      pairing_guidance:
        "Use this to establish the page or section hierarchy first. After selecting it, always run Pass 2 and compare compatible effects from OriginKit, React Bits, Canvas UI, and Lumora enhancement recipes.",
      codex_selection_instruction:
        "Shortlist this during Pass 1 for the base composition. Do not stop after choosing it: record the chosen layout, then run the required Pass 2 enhancement review.",
    };
  }

  const family = external
    ? externalFamily(record)
    : ownedEnhancementFamilies[record.category] ?? "effect / interaction";
  if (sectionCanvas) {
    return {
      selection_pass: "enhancement",
      selection_pass_label: "Pass 2 · Effects / motion",
      component_role: "section-canvas",
      enhancement_family: "background / section canvas",
      required_review: external,
      can_be_structural: false,
      section_canvas: true,
      requires_structural_pairing: true,
      text_overlay_capability: "supported-with-contrast-audit",
      foreground_content_guidance:
        "Use this as the visual canvas behind a semantic Pass 1 hero or full-width section. Add real heading, body, CTA, and navigation content in a separate foreground layer; this background does not replace the content structure.",
      overlay_readability_guidance:
        "Test text contrast against the brightest and busiest animation frames. Add a brand-matched scrim, gradient, quiet zone, blur, or solid content panel when needed, and provide a static prefers-reduced-motion fallback.",
      pairing_guidance:
        "Pair this with a Pass 1 hero or full-width section as its section-scale visual canvas. It may define the section's visual identity, but it must not replace semantic content, layout, or controls.",
      codex_selection_instruction: external
        ? `Required Pass 2 review source: ${record.source}. Treat this as a section-capable visual foundation, not a small decorative effect. Compare it against the selected hero or section structure even if the final decision is to use none.`
        : "Review this during Pass 2 as a section-capable visual foundation. Pair it with the selected hero or full-width section only when it earns the signature enhancement slot.",
    };
  }

  return {
    selection_pass: "enhancement",
    selection_pass_label: "Pass 2 · Effects / motion",
    component_role: hybrid ? "hybrid-section-or-enhancement" : "enhancement",
    enhancement_family: family,
    required_review: external,
    can_be_structural: hybrid,
    pairing_guidance: hybrid
      ? "Review this after the base layout. It may enhance an existing section or replace one structural section when its content and interaction contract are the stronger fit."
      : "Pair this with the selected base composition only when it improves hierarchy, feedback, storytelling, comprehension, or brand character.",
    codex_selection_instruction: external
      ? `Required Pass 2 review source: ${record.source}. Compare this effect against the selected layout even if the final decision is to use none.`
      : "Review this during Pass 2 after the base composition is chosen. Use it only when it earns an enhancement slot.",
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
    enhancement_slot_policy:
      "Choose zero to three enhancements total: normally one signature and up to two supporting or subtle treatments.",
    stacking_limit:
      "Use at most one continuous ambient animation and one heavy canvas, WebGL, or 3D effect in or near the initial viewport.",
  };
}
