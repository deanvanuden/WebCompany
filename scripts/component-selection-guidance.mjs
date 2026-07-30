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
  return {
    ...record,
    ...componentSelectionProfile(record),
    enhancement_slot_policy:
      "Choose zero to three enhancements total: normally one signature and up to two supporting or subtle treatments.",
    stacking_limit:
      "Use at most one continuous ambient animation and one heavy canvas, WebGL, or 3D effect in or near the initial viewport.",
  };
}
