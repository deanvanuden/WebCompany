import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  componentPreviewCount,
  componentPreviewMarkup,
} from "./component-previews.js";

const PAGE_SIZE = 30;
const publicRoot = "https://lumoraofficial.de/mcp";
const hlsRuntimeUrl =
  "https://cdn.jsdelivr.net/npm/hls.js@1.6.16/dist/hls.light.min.js";
const buildVersion =
  new URL(import.meta.url).searchParams.get("v") ?? "development";

function catalogUrl(relativePath) {
  const url = new URL(relativePath, import.meta.url);
  url.searchParams.set("v", buildVersion);
  return url;
}

const state = {
  view: "models",
  models: [],
  components: [],
  images: [],
  backgrounds: [],
  componentRecords: null,
  selectedModelId: null,
  selectedComponentId: null,
  selectedImageId: null,
  selectedBackgroundId: null,
  query: "",
  primary: "All",
  category: "All",
  secondary: "All",
  visibleCount: PAGE_SIZE,
  sort: "featured",
};

const elements = {
  tabs: [...document.querySelectorAll("[data-view]")],
  workspace: document.querySelector('[data-panel="catalog"]'),
  integration: document.querySelector('[data-panel="integration"]'),
  search: document.querySelector("#catalog-search"),
  primaryLabel: document.querySelector("#primary-filter-label"),
  primaryFilter: document.querySelector("#primary-filter"),
  categoryLabel: document.querySelector("#category-filter-label"),
  categoryFilter: document.querySelector("#category-filter"),
  secondaryLabel: document.querySelector("#secondary-filter-label"),
  secondaryFilter: document.querySelector("#secondary-filter"),
  rightsCard: document.querySelector("#rights-card"),
  catalogKicker: document.querySelector("#catalog-kicker"),
  catalogTitle: document.querySelector("#catalog-title"),
  catalogCount: document.querySelector("#catalog-count"),
  catalogScope: document.querySelector("#catalog-scope"),
  catalogGrid: document.querySelector("#catalog-grid"),
  catalogSort: document.querySelector("#catalog-sort"),
  progressCopy: document.querySelector("#catalog-progress-copy"),
  loadMore: document.querySelector("#load-more"),
  modelInspector: document.querySelector("#model-inspector"),
  componentInspector: document.querySelector("#component-inspector"),
  imageInspector: document.querySelector("#image-inspector"),
  backgroundInspector: document.querySelector("#background-inspector"),
  toast: document.querySelector("#toast"),
};

let toastTimer = null;
let viewer = null;
let backgroundPlayer = null;
let hlsRuntimePromise = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCount(value) {
  return Number(value ?? 0).toLocaleString("en-US");
}

function formatPolygons(value) {
  const count = Number(value ?? 0);
  if (count < 1000) return formatCount(count);
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  return `${Math.round(count / 1000)}k`;
}

function normalized(value) {
  return String(value ?? "").trim().toLowerCase();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 1800);
}

async function copyText(value, message = "Copied to clipboard") {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const field = document.createElement("textarea");
    field.value = value;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  }
  showToast(message);
}

function ensureHlsRuntime() {
  if (window.Hls) return Promise.resolve(window.Hls);
  if (hlsRuntimePromise) return hlsRuntimePromise;

  hlsRuntimePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = hlsRuntimeUrl;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.addEventListener("load", () => resolve(window.Hls));
    script.addEventListener("error", () => {
      hlsRuntimePromise = null;
      reject(new Error("The HLS preview runtime could not be loaded."));
    });
    document.head.append(script);
  });

  return hlsRuntimePromise;
}

function currentDataset() {
  if (state.view === "models") return state.models;
  if (state.view === "components") return state.components;
  if (state.view === "images") return state.images;
  return state.backgrounds;
}

function fieldConfiguration() {
  if (state.view === "models") {
    return {
      primary: "source",
      primaryLabel: "Source",
      category: "category",
      categoryLabel: "Category",
      secondary: "collection",
      secondaryLabel: "Collection",
    };
  }
  if (state.view === "backgrounds") {
    return {
      primary: "format",
      primaryLabel: "Format",
      category: "availability",
      categoryLabel: "Availability",
      secondary: "hostLabel",
      secondaryLabel: "Host",
    };
  }
  if (state.view === "images") {
    return {
      primary: "source",
      primaryLabel: "Source",
      category: "assetType",
      categoryLabel: "Asset kind",
      secondary: "styleFamily",
      secondaryLabel: "Visual style",
    };
  }
  return {
    primary: "impact",
    primaryLabel: "Impact",
    category: "category",
    categoryLabel: "Category",
    secondary: "art_direction",
    secondaryLabel: "Art direction",
  };
}

function optionCounts(field) {
  const counts = new Map([["All", currentDataset().length]]);
  for (const record of currentDataset()) {
    const value = record[field] || "Unclassified";
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([left], [right]) => {
    if (left === "All") return -1;
    if (right === "All") return 1;
    return left.localeCompare(right);
  });
}

function filterOptionsMarkup(options, selected, group) {
  return options
    .map(
      ([value, count]) => `
        <button
          type="button"
          class="${selected === value ? "is-active" : ""}"
          data-filter-group="${group}"
          data-filter-value="${escapeHtml(value)}"
          aria-pressed="${selected === value}"
        >
          <span>${escapeHtml(filterValueLabel(value, group))}</span>
          <span>${String(count).padStart(3, "0")}</span>
        </button>
      `,
    )
    .join("");
}

function filterValueLabel(value, group) {
  if (state.view !== "images" || group !== "secondary" || value === "All") {
    return value;
  }
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderFilters() {
  const config = fieldConfiguration();
  elements.primaryLabel.textContent = config.primaryLabel;
  elements.categoryLabel.textContent = config.categoryLabel;
  elements.secondaryLabel.textContent = config.secondaryLabel;
  elements.primaryFilter.innerHTML = filterOptionsMarkup(
    optionCounts(config.primary),
    state.primary,
    "primary",
  );
  elements.categoryFilter.innerHTML = filterOptionsMarkup(
    optionCounts(config.category),
    state.category,
    "category",
  );
  elements.secondaryFilter.innerHTML = filterOptionsMarkup(
    optionCounts(config.secondary),
    state.secondary,
    "secondary",
  );
  elements.rightsCard.hidden = state.view === "components";
  elements.rightsCard.innerHTML =
    state.view === "backgrounds"
      ? `
        <span aria-hidden="true">✓</span>
        <p>
          <strong>Commercial use confirmed.</strong>
          Lumora has licensed this collection for commercial work.
        </p>
      `
      : state.view === "images"
        ? `
        <span aria-hidden="true">✓</span>
        <p>
          <strong>Usage mode travels with every asset.</strong>
          Bundled, generated, attributed, linked, and trademark-aware records are clearly separated.
        </p>
      `
        : `
        <span aria-hidden="true">✓</span>
        <p>
          <strong>Rights travel with the record.</strong>
          Every source, creator, licence, and warning remains attached.
        </p>
      `;
}

function filteredRecords() {
  const config = fieldConfiguration();
  const query = normalized(state.query);
  const dataset = currentDataset().filter((record) => {
    const matchesPrimary =
      state.primary === "All" || record[config.primary] === state.primary;
    const matchesCategory =
      state.category === "All" || record[config.category] === state.category;
    const matchesSecondary =
      state.secondary === "All" ||
      record[config.secondary] === state.secondary;

    let searchable;
    if (state.view === "models") {
      searchable = [
        record.name,
        record.source,
        record.collection,
        record.category,
        record.creator,
        record.agencyUse,
        record.artStyle,
        record.visualFidelity,
        record.visualFidelityLabel,
        record.selectionPriority,
        record.selectionGuidance,
        record.fallbackPolicy,
        record.performanceGuidance,
        ...(record.tags ?? []),
        ...(record.bestFor ?? []),
        ...(record.avoidWhen ?? []),
        ...(record.brandMoods ?? []),
        ...(record.websiteIndustries ?? []),
        ...(record.sectionFits ?? []),
      ];
    } else if (state.view === "backgrounds") {
      searchable = [
        record.name,
        record.format,
        record.availability,
        record.hostLabel,
        record.sourceHost,
        record.sourceUrl,
        record.summary,
      ];
    } else if (state.view === "images") {
      searchable = [
        record.name,
        record.source,
        record.assetType,
        record.category,
        record.collection,
        record.description,
        record.recommendedUse,
        record.conceptId,
        record.styleFamily,
        record.artStyle,
        record.usageMode,
        record.selectionGuidance,
        record.iconLicence,
        ...(record.tags ?? []),
        ...(record.bestFor ?? []),
        ...(record.avoidWhen ?? []),
      ];
    } else {
      searchable = [
        record.name,
        record.category,
        record.art_direction,
        record.summary,
        record.style_tags,
        record.best_for,
        record.framework_fit,
      ];
    }
    const matchesQuery =
      !query || normalized(searchable.join(" ")).includes(query);

    return (
      matchesPrimary &&
      matchesCategory &&
      matchesSecondary &&
      matchesQuery
    );
  });

  return dataset.sort((left, right) => {
    if (state.sort === "name") return left.name.localeCompare(right.name);
    if (state.view === "models") {
      if (state.sort === "lightest") {
        return left.fileSizeMB - right.fileSizeMB || left.name.localeCompare(right.name);
      }
      if (state.sort === "geometry") {
        return left.polygons - right.polygons || left.name.localeCompare(right.name);
      }
      if (left.source !== right.source) {
        const sourceRank = { Quaternius: 0, Kenney: 1, "Poly Haven": 2 };
        return (
          (sourceRank[left.source] ?? 3) - (sourceRank[right.source] ?? 3)
        );
      }
      if (left.storage !== right.storage) return left.storage === "local" ? -1 : 1;
      return left.name.localeCompare(right.name);
    }
    if (state.view === "images") {
      if (state.sort === "size") {
        const leftSize = left.fileSizeKB || Number.POSITIVE_INFINITY;
        const rightSize = right.fileSizeKB || Number.POSITIVE_INFINITY;
        return leftSize - rightSize || left.name.localeCompare(right.name);
      }
      if (state.sort === "dimensions") {
        return (
          left.width * left.height - right.width * right.height ||
          left.name.localeCompare(right.name)
        );
      }
      return (
        (left.featuredRank ?? 100) - (right.featuredRank ?? 100) ||
        left.sourceOrder - right.sourceOrder ||
        left.name.localeCompare(right.name)
      );
    }
    if (state.view === "backgrounds") {
      if (state.sort === "format") {
        return (
          left.format.localeCompare(right.format) ||
          left.sourceOrder - right.sourceOrder
        );
      }
      if (state.sort === "size") {
        return (
          (left.fileSizeMB ?? Number.POSITIVE_INFINITY) -
            (right.fileSizeMB ?? Number.POSITIVE_INFINITY) ||
          left.sourceOrder - right.sourceOrder
        );
      }
      if (left.availability !== right.availability) {
        return left.availability === "Available" ? -1 : 1;
      }
      return left.sourceOrder - right.sourceOrder;
    }
    if (state.sort === "novelty") {
      return right.novelty_score - left.novelty_score || right.quality_score - left.quality_score;
    }
    if (state.sort === "performance") {
      const rank = { low: 0, medium: 1, high: 2 };
      return (
        (rank[left.performance_cost] ?? 3) -
          (rank[right.performance_cost] ?? 3) ||
        right.quality_score - left.quality_score
      );
    }
    return (
      right.quality_score - left.quality_score ||
      right.novelty_score - left.novelty_score ||
      left.name.localeCompare(right.name)
    );
  });
}

function modelCard(record) {
  return `
    <button
      type="button"
      role="listitem"
      class="model-card${state.selectedModelId === record.id ? " is-selected" : ""}"
      data-record-id="${escapeHtml(record.id)}"
      aria-label="Open ${escapeHtml(record.name)} in the 3D viewer"
      aria-pressed="${state.selectedModelId === record.id}"
    >
      <span class="card-media">
        <img
          src="${escapeHtml(record.thumbnailUrl)}"
          alt=""
          width="320"
          height="260"
          loading="lazy"
        />
        <span class="card-grade" data-grade="${escapeHtml(record.performance)}">
          ${escapeHtml(record.performance)}
        </span>
        <span class="card-source">${escapeHtml(record.source)}</span>
      </span>
      <span class="card-copy">
        <h3>${escapeHtml(record.name)}</h3>
        <p>${escapeHtml(record.collection)}</p>
        <span class="card-meta">
          <span>${Number(record.fileSizeMB).toFixed(record.fileSizeMB < 0.1 ? 3 : 2)} MB</span>
          <span>${formatPolygons(record.polygons)} polys</span>
          <span>${escapeHtml(record.category)}</span>
        </span>
      </span>
    </button>
  `;
}

function isExternalComponent(record) {
  return record.source_kind === "external-linked-component";
}

function componentVisualMarkup(record, { inspector = false } = {}) {
  if (!isExternalComponent(record) || !record.preview_poster_url) {
    return componentPreviewMarkup(record);
  }
  const reducedMotion =
    inspector &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const video =
    inspector && record.preview_video_url
      ? `
        <video
          src="${escapeHtml(record.preview_video_url)}"
          poster="${escapeHtml(record.preview_poster_url)}"
          muted
          loop
          playsinline
          preload="metadata"
          ${reducedMotion ? "" : "autoplay"}
          aria-hidden="true"
        ></video>
      `
      : "";
  return `
    <span class="external-component-preview">
      <img
        src="${escapeHtml(record.preview_poster_url)}"
        alt=""
        loading="${inspector ? "eager" : "lazy"}"
      />
      ${video}
    </span>
  `;
}

function componentCard(record) {
  const archetype = record.id.split("--")[0];
  const external = isExternalComponent(record);
  return `
    <button
      type="button"
      role="listitem"
      class="component-card${external ? " is-external" : ""}${state.selectedComponentId === record.id ? " is-selected" : ""}"
      data-record-id="${escapeHtml(record.id)}"
      data-direction="${escapeHtml(record.art_direction)}"
      data-archetype="${escapeHtml(archetype)}"
      aria-label="Inspect ${escapeHtml(record.name)}"
      aria-pressed="${state.selectedComponentId === record.id}"
    >
      <span class="component-card-visual">
        ${componentVisualMarkup(record)}
        <span class="component-visual-label">${escapeHtml(external ? "OriginKit · official preview" : record.art_direction)}</span>
      </span>
      <span class="card-copy">
        <h3>${escapeHtml(record.name)}</h3>
        <p>${escapeHtml(record.summary)}</p>
        <span class="card-meta">
          <span>${external ? "OFFICIAL" : `Q${record.quality_score}`}</span>
          <span>${external ? "LINKED" : `N${record.novelty_score}`}</span>
          <span>${escapeHtml(record.category)}</span>
        </span>
      </span>
    </button>
  `;
}

function imageCard(record) {
  const selected = state.selectedImageId === record.id;
  const renderingClass = record.pixelArt ? " is-pixel-art" : "";
  const tilePreview = record.previewMode === "tile";
  const payload = record.fileSizeKB
    ? `${Number(record.fileSizeKB).toFixed(record.fileSizeKB < 10 ? 1 : 0)} KB`
    : record.usageMode === "generator"
      ? "generator"
      : record.storage === "remote"
        ? "linked"
        : "variable";
  const variantLabel =
    Number(record.variantCount) > 1
      ? `${record.variantCount} variants`
      : record.dimensions;
  return `
    <button
      type="button"
      role="listitem"
      class="image-card${selected ? " is-selected" : ""}${renderingClass}"
      data-record-id="${escapeHtml(record.id)}"
      aria-label="Inspect ${escapeHtml(record.name)}"
      aria-pressed="${selected}"
    >
      <span class="image-card-visual${tilePreview ? " is-tile-preview" : ""}${record.previewMode === "cover" ? " is-cover-preview" : ""}">
        ${
          tilePreview
            ? `<span
                class="image-card-tile"
                style="background-image:url('${escapeHtml(record.imageUrl)}')"
                aria-hidden="true"
              ></span>`
            : ""
        }
        <img
          src="${escapeHtml(record.imageUrl)}"
          alt=""
          width="${record.width || 256}"
          height="${record.height || 256}"
          loading="lazy"
        />
        <span class="image-card-pack">${escapeHtml(record.collection)}</span>
        <span class="image-card-format">${escapeHtml(record.format)}</span>
      </span>
      <span class="card-copy">
        <h3>${escapeHtml(record.name)}</h3>
        <p>${escapeHtml(record.category)} · ${escapeHtml(variantLabel)}</p>
        <span class="card-meta">
          <span>${escapeHtml(record.assetType)}</span>
          <span>${escapeHtml(payload)}</span>
          <span>${escapeHtml(record.source)}</span>
        </span>
      </span>
    </button>
  `;
}

function backgroundCard(record) {
  const selected = state.selectedBackgroundId === record.id;
  const unavailable = record.availability !== "Available";
  const sizeLabel = record.fileSizeMB
    ? `${record.fileSizeMB.toFixed(1)} MB`
    : "adaptive";
  return `
    <button
      type="button"
      role="listitem"
      class="background-card${selected ? " is-selected" : ""}${unavailable ? " is-unavailable" : ""}"
      data-record-id="${escapeHtml(record.id)}"
      data-background-format="${escapeHtml(record.format)}"
      aria-label="Preview ${escapeHtml(record.name)}"
      aria-pressed="${selected}"
    >
      <span
        class="background-card-visual"
        data-pattern="${record.previewPattern}"
        style="--background-hue: ${record.accentHue}"
      >
        ${
          record.thumbnailUrl
            ? `<img
                src="${escapeHtml(record.thumbnailUrl)}"
                alt=""
                width="640"
                height="360"
                loading="lazy"
              />`
            : ""
        }
        <video
          aria-hidden="true"
          muted
          loop
          playsinline
          preload="none"
        ></video>
        <span class="background-card-index">BG / ${String(record.sourceOrder).padStart(3, "0")}</span>
        <span class="background-card-format">${escapeHtml(record.format)}</span>
        <span class="background-card-action">
          ${unavailable ? "SOURCE OFFLINE" : record.format === "MP4" ? "HOVER TO PREVIEW" : "SELECT TO PREVIEW"}
        </span>
      </span>
      <span class="card-copy">
        <h3>${escapeHtml(record.name)}</h3>
        <p>${escapeHtml(record.hostLabel)} · externally hosted</p>
        <span class="card-meta">
          <span>${escapeHtml(sizeLabel)}</span>
          <span>${escapeHtml(record.availability)}</span>
          <span>commercial use</span>
        </span>
      </span>
    </button>
  `;
}

function renderCatalog() {
  if (state.view === "integration") return;
  const records = filteredRecords();
  const visible = records.slice(0, state.visibleCount);
  const noun =
    state.view === "models"
      ? "objects"
      : state.view === "components"
        ? "recipes"
        : state.view === "images"
          ? "assets"
          : "backgrounds";

  elements.catalogTitle.textContent =
    state.query ||
    state.primary !== "All" ||
    state.category !== "All" ||
    state.secondary !== "All"
      ? `Filtered ${noun}`
      : `All ${noun}`;
  elements.catalogCount.textContent = `${formatCount(records.length)} matching ${noun}`;
  elements.catalogScope.textContent =
    state.view === "models"
      ? "Kenney + Quaternius + Poly Haven"
      : state.view === "components"
        ? "12 original art directions"
        : state.view === "images"
          ? `${formatCount(new Set(state.images.map((image) => image.collection)).size)} collections · bundled + linked + generated`
          : `${formatCount(state.backgrounds.filter((background) => background.availability === "Available").length)} live external sources`;
  elements.progressCopy.textContent = records.length
    ? `Showing ${formatCount(visible.length)} of ${formatCount(records.length)} ${noun}`
    : "No matching records";
  elements.loadMore.hidden = visible.length >= records.length;
  elements.loadMore.textContent = `Load ${Math.min(
    PAGE_SIZE,
    records.length - visible.length,
  )} more`;

  if (!visible.length) {
    elements.catalogGrid.innerHTML = `
      <div class="empty-state" role="status">
        <strong>No matching ${noun}</strong>
        <span>Try a broader term or filter.</span>
      </div>
    `;
    return;
  }

  elements.catalogGrid.innerHTML = visible
    .map((record) => {
      if (state.view === "models") return modelCard(record);
      if (state.view === "components") return componentCard(record);
      if (state.view === "images") return imageCard(record);
      return backgroundCard(record);
    })
    .join("");
}

function sortOptionsForView() {
  if (state.view === "models") {
    return [
      ["featured", "Featured"],
      ["name", "Name A–Z"],
      ["lightest", "Lightest first"],
      ["geometry", "Lowest geometry"],
    ];
  }
  if (state.view === "backgrounds") {
    return [
      ["featured", "Source order"],
      ["name", "Name A–Z"],
      ["format", "Format"],
      ["size", "Smallest MP4"],
    ];
  }
  if (state.view === "images") {
    return [
      ["featured", "Curated sources"],
      ["name", "Name A–Z"],
      ["size", "Smallest file"],
      ["dimensions", "Smallest dimensions"],
    ];
  }
  return [
    ["featured", "Highest quality"],
    ["novelty", "Highest novelty"],
    ["name", "Name A–Z"],
    ["performance", "Lightest first"],
  ];
}

function renderSortOptions() {
  elements.catalogSort.innerHTML = sortOptionsForView()
    .map(
      ([value, label]) =>
        `<option value="${value}"${state.sort === value ? " selected" : ""}>${label}</option>`,
    )
    .join("");
}

function updateHash(type, id) {
  const nextHash = `#${type}/${encodeURIComponent(id)}`;
  if (window.location.hash !== nextHash) {
    history.replaceState(null, "", nextHash);
  }
}

function renderModelInspector(record) {
  document.querySelector("#model-name").textContent = record.name;
  document.querySelector("#model-index").textContent =
    `${String(state.models.findIndex((model) => model.id === record.id) + 1).padStart(3, "0")} / ${String(state.models.length).padStart(3, "0")}`;
  document.querySelector("#model-description").textContent = record.description;
  document.querySelector("#model-badges").innerHTML = [
    record.source,
    record.artStyle,
    record.selectionPriority,
    record.category,
    record.animations ? `${record.animations} animation clips` : "static",
    `${record.performance} performance`,
  ]
    .filter(Boolean)
    .map((badge) => `<span>${escapeHtml(badge)}</span>`)
    .join("");
  document.querySelector("#model-best-for").textContent =
    record.agencyUse ?? "A focused scene object selected to support the page narrative";
  document.querySelector("#model-style-guidance").textContent =
    record.selectionGuidance ??
    "Confirm the model's visible art direction supports the brand rather than selecting it from its name or category alone.";
  document.querySelector("#model-avoid-when").textContent =
    record.avoidWhen?.join(", ") ??
    "Any composition where its style, detail level, or material language conflicts with the brand";
  document.querySelector("#model-brand-fit").textContent =
    record.brandMoods?.join(", ") ??
    "Adapt materials, lighting, framing, and motion to the project brand";
  document.querySelector("#model-industries").textContent =
    record.websiteIndustries?.join(", ") ??
    `${record.category} scenes and visual storytelling`;
  document.querySelector("#model-fallback-policy").textContent =
    record.fallbackPolicy ??
    "If it is the closest available asset, adapt it deliberately and keep the static fallback.";
  document.querySelector("#model-performance-note").textContent =
    record.performanceGuidance ??
    "Lazy-load near the viewport and keep a lightweight static fallback.";
  document.querySelector("#model-size").textContent =
    `${Number(record.fileSizeMB).toFixed(record.fileSizeMB < 0.1 ? 3 : 2)} MB`;
  document.querySelector("#model-polygons").textContent =
    `${formatCount(record.polygons)} polys`;
  document.querySelector("#model-draw-calls").textContent =
    String(record.drawCalls).padStart(2, "0");
  document.querySelector("#model-materials").textContent =
    String(record.materials).padStart(2, "0");
  document.querySelector("#model-dimensions").textContent = record.dimensions;
  document.querySelector("#model-source").textContent =
    `${record.source} · ${record.collection}`;
  document.querySelector("#model-licence").textContent =
    record.licenceClass === "ship-safe"
      ? `${record.licence} · ship-safe`
      : `${record.licence} · concept-only`;
  document.querySelector("#model-source-link").href = record.sourceUrl;
  document.querySelector("#model-url").textContent = record.publicModelUrl;
  document.querySelector("#model-poster").src = record.thumbnailUrl;
  const prompt =
    `Read the Lumora MCP 3D model record "${record.id}" at ` +
    `${publicRoot}/models.json. Use its publicModelUrl and integrate it as ` +
    `${record.agencyUse ?? "a focused scene object"}. Adapt lighting, framing, ` +
    `materials, and motion to this project's brand. Do not select it from its name ` +
    `or category alone. Style guidance: ${(record.selectionGuidance ?? "confirm the visible art direction supports the brand").replace(/[.!?]+$/g, "")}. ` +
    `Avoid when: ${(record.avoidWhen?.join(", ") ?? "its style or detail level conflicts with the brand").replace(/[.!?]+$/g, "")}. ` +
    `Fallback rule: ${(record.fallbackPolicy ?? "use it deliberately if it is the closest available match").replace(/[.!?]+$/g, "")}. ` +
    `This guidance is advisory, not a hard exclusion. Follow this performance ` +
    `guidance: ${(record.performanceGuidance ?? "lazy-load near the viewport and keep a static fallback").replace(/[.!?]+$/g, "")}. ` +
    `Pause animation offscreen, respect prefers-reduced-motion, preserve the ` +
    `source and licence record, and do not download unrelated catalog assets.`;
  document.querySelector("#model-prompt").textContent = prompt;
  document.querySelector("#model-prompt").dataset.prompt = prompt;
}

async function selectModel(id, { updateLocation = true } = {}) {
  const record = state.models.find((model) => model.id === id);
  if (!record) return;
  state.selectedModelId = id;
  renderModelInspector(record);
  renderCatalog();
  if (updateLocation) updateHash("models", id);
  await viewer?.load(record);
}

async function ensureComponentRecords() {
  if (state.componentRecords) return state.componentRecords;
  const response = await fetch(catalogUrl("./components.json"));
  if (!response.ok) throw new Error("Complete component records are unavailable.");
  const records = await response.json();
  state.componentRecords = new Map(records.map((record) => [record.id, record]));
  return state.componentRecords;
}

function renderComponentInspector(record) {
  const external = isExternalComponent(record);
  document.querySelector("#component-name").textContent = record.name;
  document.querySelector("#component-score").textContent =
    external
      ? "OFFICIAL / LINKED"
      : `Q${record.quality_score} / N${record.novelty_score}`;
  const stage = document.querySelector("#component-stage");
  stage.dataset.direction = record.art_direction;
  stage.dataset.archetype = record.id.split("--")[0];
  stage.classList.toggle("is-external", external);
  stage.innerHTML = `
    ${componentVisualMarkup(record, { inspector: true })}
    <span class="component-visual-label">${escapeHtml(external ? "ORIGINKIT · REMOTE PREVIEW" : record.art_direction.toUpperCase())}</span>
  `;
  document.querySelector("#component-summary").textContent = record.summary;
  document.querySelector("#component-technique").textContent =
    record.technique ?? "Open the complete record for implementation detail.";
  document.querySelector("#component-best-for").textContent = record.best_for;
  document.querySelector("#component-responsive").textContent =
    record.responsive_strategy ??
    "Preserve hierarchy and simplify the spatial composition on narrow screens.";
  document.querySelector("#component-accessibility").textContent =
    record.accessibility_contract ??
    "Preserve semantics, keyboard behavior, and reduced-motion fallbacks.";
  document.querySelector("#component-badges").innerHTML = [
    record.category,
    record.art_direction,
    record.impact,
    `${record.performance_cost} cost`,
    record.compatibility,
  ]
    .filter(Boolean)
    .map((badge) => `<span>${escapeHtml(badge)}</span>`)
    .join("");

  const prompt =
    external
      ? `Read the Lumora MCP component record "${record.id}" at ${publicRoot}/components.json. Open its official_source_url to inspect and retrieve the current OriginKit implementation and dependencies. Adapt it to this project's framework, content, and brand; preserve responsive behavior, accessibility, reduced motion, fallback, cleanup, and performance. Do not use the remote catalog preview as production media.`
      : `Read the Lumora MCP component record "${record.id}" at ` +
        `${publicRoot}/components.json. Implement it from first principles in this ` +
        `project's framework and brand. Preserve its content, responsive, ` +
        `accessibility, fallback, performance, and test contracts.`;
  document.querySelector("#component-prompt").textContent = prompt;
  document.querySelector("#component-prompt").dataset.prompt = prompt;
  const recordLink = document.querySelector("#component-record-link");
  const recordLinkLabel = document.querySelector("#component-record-link-label");
  recordLink.href = external
    ? record.official_source_url
    : `./components.json#${encodeURIComponent(record.id)}`;
  recordLink.target = external ? "_blank" : "";
  recordLink.rel = external ? "noreferrer" : "";
  recordLinkLabel.textContent = external
    ? "Open official OriginKit component"
    : "Open complete component records";
}

async function selectComponent(id, { updateLocation = true } = {}) {
  const indexRecord = state.components.find((component) => component.id === id);
  if (!indexRecord) return;
  state.selectedComponentId = id;
  renderComponentInspector(indexRecord);
  renderCatalog();
  if (updateLocation) updateHash("components", id);

  try {
    const records = await ensureComponentRecords();
    const completeRecord = records.get(id);
    if (completeRecord && state.selectedComponentId === id) {
      renderComponentInspector(completeRecord);
    }
  } catch (error) {
    showToast(error.message);
  }
}

function imagePayloadLabel(record) {
  if (record.fileSizeKB) {
    return `${Number(record.fileSizeKB).toFixed(record.fileSizeKB < 10 ? 2 : 1)} KB`;
  }
  if (record.usageMode === "generator") return "Generated remotely";
  if (record.storage === "remote") return "Linked remotely";
  return "Variable payload";
}

function imageDeliveryLabel(record) {
  if (record.previewOnly) return "Local preview · production maps linked";
  if (record.usageMode === "generator") return "Deterministic SVG generator";
  if (record.trademarkWarning) return "Pinned SVG link · trademark-aware";
  if (record.variantCount > 1) return `${record.variantCount} grouped SVG variants`;
  if (record.pixelArt) return "Transparent pixel art";
  return record.hasAlpha ? "Transparent asset" : "Opaque asset";
}

function imageLicenceLabel(record) {
  const labels = {
    "ship-safe": "ship-safe",
    "ship-safe-generator": "CC0 generator",
    "ship-safe-linked": "CC0 linked source",
    attribution: "attribution required",
    "trademark-aware": "trademark-aware",
  };
  return `${record.licence} · ${labels[record.licenceClass] ?? record.licenceClass}`;
}

function applyImagePreview(record, imageUrl, publicUrl, variantLabel = null) {
  const stage = document.querySelector("#image-stage");
  const preview = document.querySelector("#image-preview");
  const tilePreview = record.previewMode === "tile";
  stage.classList.toggle("is-pixel-art", Boolean(record.pixelArt));
  stage.classList.toggle("is-tile-preview", tilePreview);
  stage.classList.toggle("is-cover-preview", record.previewMode === "cover");
  stage.style.backgroundImage = tilePreview ? `url("${imageUrl}")` : "";
  preview.src = imageUrl;
  preview.alt = `Preview of ${record.name}${variantLabel ? ` in ${variantLabel} style` : ""}`;
  document.querySelector("#image-url").textContent =
    publicUrl ?? record.downloadUrl ?? record.publicImageUrl;
  document.querySelector("#copy-image-url").dataset.copyUrl =
    publicUrl ?? record.downloadUrl ?? record.publicImageUrl;
  document.querySelector("#image-stage-format").textContent =
    variantLabel
      ? `${record.format} · ${variantLabel}`.toUpperCase()
      : record.format.toUpperCase();
}

function renderImageInspector(record) {
  const usageMode =
    record.usageMode ?? (record.storage === "local" ? "bundled" : "linked");
  document.querySelector("#image-name").textContent = record.name;
  document.querySelector("#image-kicker").textContent =
    `${record.source.toUpperCase()} · ${usageMode.replaceAll("-", " ").toUpperCase()}`;
  document.querySelector("#image-index").textContent =
    `${String(state.images.findIndex((image) => image.id === record.id) + 1).padStart(4, "0")} / ${String(state.images.length).padStart(4, "0")}`;
  document.querySelector("#image-description").textContent =
    `${record.description} ${record.recommendedUse} ${record.selectionGuidance ?? ""}`.trim();
  document.querySelector("#image-dimensions").textContent = record.dimensions;
  document.querySelector("#image-size").textContent = imagePayloadLabel(record);
  document.querySelector("#image-alpha").textContent = imageDeliveryLabel(record);
  document.querySelector("#image-category").textContent = record.category;
  document.querySelector("#image-style").textContent =
    record.artStyle ?? record.styleFamily ?? "Unclassified";
  document.querySelector("#image-pack").textContent = record.collection;
  document.querySelector("#image-usage-mode").textContent =
    usageMode.replaceAll("-", " ");
  document.querySelector("#image-licence").textContent =
    imageLicenceLabel(record);
  document.querySelector("#image-source").textContent =
    `${record.source} · ${record.collection}`;
  document.querySelector("#image-rights").textContent =
    record.trademarkWarning
      ? "BRAND RIGHTS APPLY"
      : record.licenceClass === "attribution"
        ? "ATTRIBUTION REQUIRED"
        : "COMMERCIAL USE";
  const sourceLink = document.querySelector("#image-source-link");
  sourceLink.href = record.sourceUrl;
  sourceLink.textContent = "Original source ↗";

  const copyLabel = document.querySelector("#image-url-label");
  const copyButton = document.querySelector("#copy-image-url");
  let copyUrl = record.downloadUrl ?? record.publicImageUrl;
  if (record.usageMode === "generator") {
    copyLabel.textContent = "GENERATOR URL TEMPLATE";
  } else if (record.previewOnly) {
    copyLabel.textContent = "OFFICIAL MATERIAL PAGE";
  } else if (record.trademarkWarning) {
    copyLabel.textContent = "PINNED BRAND SVG URL";
  } else if (record.variantCount > 1) {
    copyLabel.textContent = "SELECTED VARIANT URL";
    copyUrl = record.variants?.[record.defaultVariant ?? "regular"]?.publicImageUrl ?? copyUrl;
  } else {
    copyLabel.textContent = "PUBLIC ASSET URL";
  }
  copyButton.dataset.copyUrl = copyUrl;
  document.querySelector("#image-url").textContent = copyUrl;

  const stageMode = document.querySelector("#image-stage-mode");
  stageMode.textContent = record.previewOnly
    ? "Selection preview"
    : record.variantCount > 1
      ? "Grouped styles"
      : record.storage === "remote"
        ? "Official link"
        : "Native asset";
  applyImagePreview(record, record.imageUrl, copyUrl);

  const variantPicker = document.querySelector("#image-variant-picker");
  const variants = Object.entries(record.variants ?? {});
  variantPicker.hidden = variants.length === 0;
  variantPicker.innerHTML = variants.length
    ? `
      <span>Choose style</span>
      <div>
        ${variants
          .map(
            ([name, variant], index) => `
              <button
                type="button"
                class="${index === 0 ? "is-active" : ""}"
                aria-pressed="${index === 0}"
                data-image-variant="${escapeHtml(name)}"
                data-image-variant-url="${escapeHtml(variant.imageUrl)}"
                data-image-variant-public-url="${escapeHtml(variant.publicImageUrl)}"
              >${escapeHtml(name)}</button>
            `,
          )
          .join("")}
      </div>
    `
    : "";

  document.querySelector("#image-badges").innerHTML = [
    record.assetType,
    record.category,
    record.artStyle,
    record.variantCount > 1 ? `${record.variantCount} variants` : null,
    record.tileable ? "tileable" : null,
    record.licenceClass,
  ]
    .filter(Boolean)
    .map((badge) => `<span>${escapeHtml(badge)}</span>`)
    .join("");

  const implementationInstruction = record.previewOnly
    ? `The local publicImageUrl is a preview only; open downloadUrl and fetch the production PBR maps listed in the record.`
    : record.usageMode === "generator"
      ? `Replace {seed} in generatorTemplateUrl with a stable project value and use one avatar style consistently.`
      : record.trademarkWarning
        ? `Use the pinned SVG only for a brand genuinely referenced by the project; inspect brandGuidelinesUrl, iconLicence, and trademarkWarning first.`
        : record.variantCount > 1
          ? `Choose one named variant from variants and use that weight consistently across the interface hierarchy.`
          : `Use publicImageUrl only if the asset's visual language supports the composition.`;
  const rightsInstruction =
    record.licenceClass === "attribution"
      ? ` Preserve this attribution: ${record.attribution}`
      : " Preserve the attached source and licence metadata.";
  const prompt =
    `Read the Lumora MCP image asset record "${record.id}" at ` +
    `${publicRoot}/image-assets.json. Compare its styleFamily, artStyle, bestFor, ` +
    `avoidWhen, and selectionGuidance with other records sharing a similar conceptId. ` +
    `${implementationInstruction}${rightsInstruction}` +
    `${record.pixelArt ? " Render it with crisp nearest-neighbor pixels." : ""}` +
    `${record.previewMode === "tile" ? " Repeat and recolor it only as an intentional background pattern." : ""} ` +
    `Preserve its native aspect ratio and optimize delivery without visibly degrading it.`;
  const promptElement = document.querySelector("#image-prompt");
  promptElement.textContent = prompt;
  promptElement.dataset.prompt = prompt;
  document.querySelector("#image-record-link").href =
    `./image-assets.json#${encodeURIComponent(record.id)}`;
}

async function selectImage(id, { updateLocation = true } = {}) {
  const record = state.images.find((image) => image.id === id);
  if (!record) return;
  state.selectedImageId = id;
  renderImageInspector(record);
  renderCatalog();
  if (updateLocation) updateHash("images", id);
}

function renderBackgroundInspector(record) {
  document.querySelector("#background-name").textContent = record.name;
  document.querySelector("#background-index").textContent =
    `${String(record.sourceOrder).padStart(3, "0")} / ${String(state.backgrounds.length).padStart(3, "0")}`;
  document.querySelector("#background-summary").textContent =
    `${record.summary} ${record.performanceGuidance}`;
  document.querySelector("#background-format").textContent = record.format;
  document.querySelector("#background-host").textContent = record.hostLabel;
  document.querySelector("#background-retrieval").textContent =
    record.retrievalMode === "direct-download"
      ? "Direct download"
      : "Adaptive stream";
  document.querySelector("#background-availability").textContent =
    `${record.availability} · HTTP ${record.httpStatus}`;
  document.querySelector("#background-rights").textContent =
    "Commercial use confirmed";
  document.querySelector("#background-source-host").textContent =
    record.sourceHost;
  document.querySelector("#background-source-link").href = record.sourceUrl;
  document.querySelector("#background-url").textContent = record.downloadUrl;
  document.querySelector("#background-stage").style.setProperty(
    "--background-hue",
    record.accentHue,
  );
  document.querySelector("#background-stage").dataset.pattern =
    record.previewPattern;
  document.querySelector("#background-badges").innerHTML = [
    record.format,
    record.hostLabel,
    record.availability,
    record.storage,
    "commercial use",
  ]
    .map((badge) => `<span>${escapeHtml(badge)}</span>`)
    .join("");

  const prompt =
    `Read the Lumora MCP animated background record "${record.id}" at ` +
    `${publicRoot}/animated-backgrounds.json. Preview its commercially licensed ` +
    `external source, then fetch the selected ${record.format} from its ` +
    `downloadUrl. Adapt it to this project's brand, ` +
    `remove audio, optimize resolution and bitrate, lazy-load it, and provide ` +
    `a static prefers-reduced-motion fallback.`;
  const promptElement = document.querySelector("#background-prompt");
  promptElement.textContent = prompt;
  promptElement.dataset.prompt = prompt;
  document.querySelector("#background-record-link").href =
    `./animated-backgrounds.json#${encodeURIComponent(record.id)}`;
}

async function selectBackground(id, { updateLocation = true } = {}) {
  const record = state.backgrounds.find((background) => background.id === id);
  if (!record) return;
  state.selectedBackgroundId = id;
  renderBackgroundInspector(record);
  renderCatalog();
  if (updateLocation) updateHash("backgrounds", id);
  await backgroundPlayer?.load(record);
}

function resetFilters() {
  state.query = "";
  state.primary = "All";
  state.category = "All";
  state.secondary = "All";
  state.visibleCount = PAGE_SIZE;
  elements.search.value = "";
}

function setView(view, { updateLocation = true } = {}) {
  if (
    !["models", "components", "images", "backgrounds", "integration"].includes(
      view,
    )
  ) {
    return;
  }
  state.view = view;
  resetFilters();
  state.sort = "featured";

  elements.tabs.forEach((tab) => {
    const active = tab.dataset.view === view;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-pressed", String(active));
  });

  const integration = view === "integration";
  elements.workspace.hidden = integration;
  elements.integration.hidden = !integration;
  viewer?.setActive(view === "models");
  backgroundPlayer?.setActive(view === "backgrounds");

  if (integration) {
    if (updateLocation) history.replaceState(null, "", "#protocol");
    return;
  }

  elements.modelInspector.hidden = view !== "models";
  elements.componentInspector.hidden = view !== "components";
  elements.imageInspector.hidden = view !== "images";
  elements.backgroundInspector.hidden = view !== "backgrounds";
  elements.catalogKicker.textContent =
    view === "models"
      ? "3D INDEX / WEB READY"
      : view === "components"
        ? "COMPONENT INDEX / OWNED ORIGINAL"
        : view === "images"
          ? "IMAGE INDEX / LOCAL CC0"
          : "BACKGROUND INDEX / EXTERNAL STREAMS";

  renderSortOptions();
  renderFilters();
  renderCatalog();

  if (view === "models" && state.selectedModelId) {
    const record = state.models.find((model) => model.id === state.selectedModelId);
    if (record) {
      renderModelInspector(record);
      viewer?.load(record);
      if (updateLocation) updateHash("models", record.id);
    }
  }
  if (view === "components" && state.selectedComponentId) {
    selectComponent(state.selectedComponentId, { updateLocation });
  }
  if (view === "images" && state.selectedImageId) {
    selectImage(state.selectedImageId, { updateLocation });
  }
  if (view === "backgrounds" && state.selectedBackgroundId) {
    selectBackground(state.selectedBackgroundId, { updateLocation });
  }
}

function readInitialRoute() {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  if (hash === "protocol") return { view: "integration", id: null };
  const [type, ...idParts] = hash.split("/");
  const id = idParts.join("/");
  if (type === "components" && id) return { view: "components", id };
  if (type === "models" && id) return { view: "models", id };
  if (type === "images" && id) return { view: "images", id };
  if (type === "backgrounds" && id) return { view: "backgrounds", id };
  return { view: "models", id: null };
}

class ModelViewer {
  constructor(stage) {
    this.stage = stage;
    this.poster = document.querySelector("#model-poster");
    this.status = document.querySelector("#stage-status");
    this.statusCopy = this.status.querySelector("span");
    this.active = true;
    this.visible = true;
    this.autoRotate = false;
    this.wireframe = false;
    this.frame = null;
    this.loadToken = 0;
    this.currentRoot = null;
    this.mixer = null;
    this.lastFrameTime = performance.now();
    this.prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      this.status.classList.add("is-error");
      this.statusCopy.textContent = "WebGL unavailable · showing poster";
      return;
    }

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.stage.insertBefore(this.renderer.domElement, this.stage.firstChild);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x151714);
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
    this.defaultCameraPosition = new THREE.Vector3(3.4, 2.3, 4.6);
    this.camera.position.copy(this.defaultCameraPosition);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.enablePan = false;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 8;
    this.controls.maxPolarAngle = Math.PI / 1.85;
    this.controls.saveState();

    const hemisphere = new THREE.HemisphereLight(0xfff7e6, 0x24312c, 2.15);
    this.scene.add(hemisphere);

    const key = new THREE.DirectionalLight(0xffe9d2, 4.8);
    key.position.set(4, 6, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -3;
    key.shadow.camera.right = 3;
    key.shadow.camera.top = 3;
    key.shadow.camera.bottom = -3;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x9ad0c0, 2.3);
    fill.position.set(-4, 2, 3);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xdfff45, 2.7);
    rim.position.set(2, 3, -4);
    this.scene.add(rim);

    this.grid = new THREE.GridHelper(10, 20, 0x5f6c63, 0x2c342e);
    this.grid.position.y = -1.28;
    this.scene.add(this.grid);

    const floorMaterial = new THREE.ShadowMaterial({
      color: 0x000000,
      opacity: 0.28,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.27;
    floor.receiveShadow = true;
    this.scene.add(floor);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.stage);
    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.visible = entry.isIntersecting;
        this.syncLoop();
      },
      { threshold: 0.02 },
    );
    this.intersectionObserver.observe(this.stage);
    document.addEventListener("visibilitychange", () => this.syncLoop());
    this.resize();
    this.syncLoop();
  }

  resize() {
    if (!this.renderer) return;
    const width = Math.max(1, this.stage.clientWidth);
    const height = Math.max(1, this.stage.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderOnce();
  }

  shouldRun() {
    return (
      this.renderer &&
      this.active &&
      this.visible &&
      document.visibilityState !== "hidden"
    );
  }

  syncLoop() {
    if (this.shouldRun() && this.frame === null) {
      this.lastFrameTime = performance.now();
      this.frame = requestAnimationFrame(() => this.animate());
    } else if (!this.shouldRun() && this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
  }

  animate() {
    this.frame = null;
    if (!this.shouldRun()) return;
    const now = performance.now();
    const delta = Math.min((now - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = now;
    if (this.mixer) this.mixer.update(delta);
    this.controls.autoRotate = this.autoRotate && !this.prefersReducedMotion;
    this.controls.autoRotateSpeed = 0.75;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(() => this.animate());
  }

  renderOnce() {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.controls?.update();
    this.renderer.render(this.scene, this.camera);
  }

  setActive(active) {
    this.active = active;
    this.syncLoop();
  }

  setStatus(message, error = false) {
    this.status.hidden = false;
    this.status.classList.toggle("is-error", error);
    this.statusCopy.textContent = message;
  }

  hideStatus() {
    this.status.hidden = true;
  }

  disposeRoot(root) {
    root?.traverse((node) => {
      if (!node.isMesh) return;
      node.geometry?.dispose();
      const materials = Array.isArray(node.material)
        ? node.material
        : [node.material];
      materials.forEach((material) => {
        for (const value of Object.values(material ?? {})) {
          if (value?.isTexture) value.dispose();
        }
        material?.dispose();
      });
    });
  }

  clear() {
    if (this.currentRoot) {
      this.scene.remove(this.currentRoot);
      this.disposeRoot(this.currentRoot);
      this.currentRoot = null;
    }
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }
  }

  resolveAssetUrl(asset, url) {
    if (asset.storage !== "remote" || !asset.files) return url;
    const value = decodeURIComponent(url).replaceAll("\\", "/");
    for (const [filename, exactUrl] of Object.entries(asset.files)) {
      const normalizedFilename = filename.replaceAll("\\", "/");
      if (
        value === normalizedFilename ||
        value.endsWith(`/${normalizedFilename}`)
      ) {
        return exactUrl;
      }
    }
    return url;
  }

  async load(asset) {
    if (!this.renderer) return;
    const token = ++this.loadToken;
    this.poster.src = asset.thumbnailUrl;
    this.poster.hidden = false;
    this.setStatus("Opening source package");
    this.clear();

    const manager = new THREE.LoadingManager();
    manager.setURLModifier((url) => this.resolveAssetUrl(asset, url));
    manager.onProgress = (_url, loaded, total) => {
      if (token !== this.loadToken) return;
      this.statusCopy.textContent = total
        ? `Loading package ${Math.round((loaded / total) * 100)}%`
        : "Loading package";
    };
    const loader = new GLTFLoader(manager);
    const modelUrl = new URL(asset.modelUrl, document.baseURI).href;

    loader.load(
      modelUrl,
      (gltf) => {
        if (token !== this.loadToken) {
          this.disposeRoot(gltf.scene);
          return;
        }

        const root = gltf.scene;
        root.traverse((node) => {
          if (!node.isMesh) return;
          node.castShadow = true;
          node.receiveShadow = true;
          const materials = Array.isArray(node.material)
            ? node.material
            : [node.material];
          materials.forEach((material) => {
            if ("wireframe" in material) material.wireframe = this.wireframe;
          });
        });

        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maximum = Math.max(size.x, size.y, size.z, 0.001);
        const scale = 2.45 / maximum;
        root.scale.setScalar(scale);
        root.position.set(
          -center.x * scale,
          -center.y * scale,
          -center.z * scale,
        );

        this.currentRoot = root;
        this.scene.add(root);

        if (gltf.animations?.length) {
          this.mixer = new THREE.AnimationMixer(root);
          const preferredClip =
            gltf.animations.find((clip) => /^idle$/i.test(clip.name)) ??
            gltf.animations.find((clip) => /idle/i.test(clip.name)) ??
            gltf.animations[0];
          this.mixer.clipAction(preferredClip).play();
        }

        this.reset();
        this.poster.hidden = true;
        this.hideStatus();
        this.renderOnce();
      },
      undefined,
      () => {
        if (token !== this.loadToken) return;
        this.setStatus("Preview failed · source record still available", true);
        this.poster.hidden = false;
      },
    );
  }

  setAutoRotate(value) {
    this.autoRotate = value;
    this.syncLoop();
  }

  setWireframe(value) {
    this.wireframe = value;
    this.currentRoot?.traverse((node) => {
      if (!node.isMesh) return;
      const materials = Array.isArray(node.material)
        ? node.material
        : [node.material];
      materials.forEach((material) => {
        if ("wireframe" in material) {
          material.wireframe = value;
          material.needsUpdate = true;
        }
      });
    });
    this.renderOnce();
  }

  reset() {
    if (!this.controls) return;
    this.camera.position.copy(this.defaultCameraPosition);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.renderOnce();
  }
}

class BackgroundPlayer {
  constructor(stage) {
    this.stage = stage;
    this.video = document.querySelector("#background-video");
    this.status = document.querySelector("#background-stage-status");
    this.statusCopy = this.status.querySelector("span");
    this.active = false;
    this.visible = true;
    this.hls = null;
    this.loadToken = 0;
    this.prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.visible = entry.isIntersecting;
        this.syncPlayback();
      },
      { threshold: 0.04 },
    );
    this.intersectionObserver.observe(stage);
    document.addEventListener("visibilitychange", () => this.syncPlayback());
  }

  setStatus(message, isError = false) {
    this.status.hidden = false;
    this.status.classList.toggle("is-error", isError);
    this.statusCopy.textContent = message;
  }

  hideStatus() {
    this.status.hidden = true;
    this.status.classList.remove("is-error");
  }

  destroyHls() {
    this.hls?.destroy();
    this.hls = null;
  }

  clearVideo() {
    this.destroyHls();
    this.video.pause();
    this.video.removeAttribute("src");
    this.video.load();
  }

  shouldPlay() {
    return (
      this.active &&
      this.visible &&
      !this.prefersReducedMotion &&
      document.visibilityState !== "hidden"
    );
  }

  syncPlayback() {
    if (!this.shouldPlay()) {
      this.video.pause();
      return;
    }
    if (this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      this.video.play().catch(() => {});
    }
  }

  setActive(value) {
    this.active = value;
    this.syncPlayback();
  }

  attachVideoEvents(token) {
    this.video.addEventListener(
      "loadeddata",
      () => {
        if (token !== this.loadToken) return;
        this.hideStatus();
        this.syncPlayback();
      },
      { once: true },
    );
    this.video.addEventListener(
      "error",
      () => {
        if (token !== this.loadToken) return;
        this.setStatus("Preview failed · source link remains available", true);
      },
      { once: true },
    );
  }

  async load(record) {
    const token = ++this.loadToken;
    this.clearVideo();
    this.video.poster = record.thumbnailUrl ?? "";
    this.setStatus(
      record.availability === "Available"
        ? `Connecting to ${record.hostLabel}`
        : `Source unavailable · HTTP ${record.httpStatus}`,
      record.availability !== "Available",
    );
    if (record.availability !== "Available") return;

    this.attachVideoEvents(token);
    if (record.format === "MP4") {
      this.video.src = record.previewUrl;
      this.video.load();
      return;
    }

    const nativeHls = this.video.canPlayType("application/vnd.apple.mpegurl");
    if (nativeHls) {
      this.video.src = record.previewUrl;
      this.video.load();
      return;
    }

    try {
      const Hls = await ensureHlsRuntime();
      if (token !== this.loadToken) return;
      if (!Hls?.isSupported()) {
        this.setStatus("HLS preview is not supported in this browser", true);
        return;
      }

      this.hls = new Hls({
        capLevelToPlayerSize: true,
        maxBufferLength: 12,
        maxMaxBufferLength: 24,
      });
      this.hls.attachMedia(this.video);
      this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        if (token === this.loadToken) this.hls.loadSource(record.previewUrl);
      });
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (token !== this.loadToken) return;
        this.hideStatus();
        this.syncPlayback();
      });
      this.hls.on(Hls.Events.ERROR, (_event, data) => {
        if (token !== this.loadToken || !data.fatal) return;
        this.setStatus("HLS preview failed · source link remains available", true);
      });
    } catch (error) {
      if (token !== this.loadToken) return;
      this.setStatus(error.message, true);
    }
  }
}

function startBackgroundCardPreview(card) {
  if (
    state.view !== "backgrounds" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }
  const record = state.backgrounds.find(
    (background) => background.id === card.dataset.recordId,
  );
  if (
    !record ||
    record.format !== "MP4" ||
    record.availability !== "Available"
  ) {
    return;
  }
  const video = card.querySelector("video");
  if (!video || video.dataset.loaded === "true") return;
  video.dataset.loaded = "true";
  video.src = record.previewUrl;
  video.load();
  video.play().catch(() => {});
  card.classList.add("is-previewing");
}

function stopBackgroundCardPreview(card) {
  const video = card.querySelector("video");
  if (!video || video.dataset.loaded !== "true") return;
  video.pause();
  video.removeAttribute("src");
  video.load();
  delete video.dataset.loaded;
  card.classList.remove("is-previewing");
}

function bindEvents() {
  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => setView(tab.dataset.view));
  });

  elements.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    state.visibleCount = PAGE_SIZE;
    renderCatalog();
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "/" &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)
    ) {
      event.preventDefault();
      elements.search.focus();
    }
  });

  for (const container of [
    elements.primaryFilter,
    elements.categoryFilter,
    elements.secondaryFilter,
  ]) {
    container.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter-group]");
      if (!button) return;
      state[button.dataset.filterGroup] = button.dataset.filterValue;
      state.visibleCount = PAGE_SIZE;
      renderFilters();
      renderCatalog();
    });
  }

  elements.catalogSort.addEventListener("change", (event) => {
    state.sort = event.target.value;
    state.visibleCount = PAGE_SIZE;
    renderCatalog();
  });

  elements.catalogGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-record-id]");
    if (!card) return;
    if (state.view === "models") selectModel(card.dataset.recordId);
    if (state.view === "components") selectComponent(card.dataset.recordId);
    if (state.view === "images") selectImage(card.dataset.recordId);
    if (state.view === "backgrounds") selectBackground(card.dataset.recordId);
  });

  elements.catalogGrid.addEventListener("pointerover", (event) => {
    const card = event.target.closest(".background-card");
    if (!card || card.contains(event.relatedTarget)) return;
    startBackgroundCardPreview(card);
  });

  elements.catalogGrid.addEventListener("pointerout", (event) => {
    const card = event.target.closest(".background-card");
    if (!card || card.contains(event.relatedTarget)) return;
    stopBackgroundCardPreview(card);
  });

  elements.catalogGrid.addEventListener("focusin", (event) => {
    const card = event.target.closest(".background-card");
    if (card) startBackgroundCardPreview(card);
  });

  elements.catalogGrid.addEventListener("focusout", (event) => {
    const card = event.target.closest(".background-card");
    if (!card || card.contains(event.relatedTarget)) return;
    stopBackgroundCardPreview(card);
  });

  elements.loadMore.addEventListener("click", () => {
    state.visibleCount += PAGE_SIZE;
    renderCatalog();
  });

  document
    .querySelector("#image-variant-picker")
    .addEventListener("click", (event) => {
      const button = event.target.closest("[data-image-variant]");
      if (!button) return;
      const record = state.images.find(
        (image) => image.id === state.selectedImageId,
      );
      if (!record) return;
      button.parentElement
        .querySelectorAll("[data-image-variant]")
        .forEach((candidate) => {
          const isActive = candidate === button;
          candidate.classList.toggle("is-active", isActive);
          candidate.setAttribute("aria-pressed", String(isActive));
        });
      applyImagePreview(
        record,
        button.dataset.imageVariantUrl,
        button.dataset.imageVariantPublicUrl,
        button.dataset.imageVariant,
      );
    });

  document.querySelector("#copy-model-url").addEventListener("click", () => {
    const record = state.models.find(
      (model) => model.id === state.selectedModelId,
    );
    if (record) copyText(record.publicModelUrl, "Model URL copied");
  });

  document.querySelector("#copy-model-prompt").addEventListener("click", () => {
    const prompt = document.querySelector("#model-prompt").dataset.prompt;
    if (prompt) copyText(prompt, "Codex prompt copied");
  });

  document
    .querySelector("#copy-component-prompt")
    .addEventListener("click", () => {
      const prompt = document.querySelector("#component-prompt").dataset.prompt;
      if (prompt) copyText(prompt, "Codex prompt copied");
    });

  document
    .querySelector("#copy-background-url")
    .addEventListener("click", () => {
      const record = state.backgrounds.find(
        (background) => background.id === state.selectedBackgroundId,
      );
      if (record) copyText(record.downloadUrl, "Background URL copied");
    });

  document.querySelector("#copy-image-url").addEventListener("click", (event) => {
    const record = state.images.find(
      (image) => image.id === state.selectedImageId,
    );
    const url = event.currentTarget.dataset.copyUrl;
    if (record && url) copyText(url, "Asset URL copied");
  });

  document
    .querySelector("#copy-image-prompt")
    .addEventListener("click", () => {
      const prompt = document.querySelector("#image-prompt").dataset.prompt;
      if (prompt) copyText(prompt, "Codex prompt copied");
    });

  document
    .querySelector("#copy-background-prompt")
    .addEventListener("click", () => {
      const prompt = document.querySelector("#background-prompt").dataset.prompt;
      if (prompt) copyText(prompt, "Codex prompt copied");
    });

  document.querySelector("#toggle-rotate").addEventListener("click", (event) => {
    const value = event.currentTarget.getAttribute("aria-pressed") !== "true";
    event.currentTarget.setAttribute("aria-pressed", String(value));
    viewer?.setAutoRotate(value);
  });

  document.querySelector("#toggle-wire").addEventListener("click", (event) => {
    const value = event.currentTarget.getAttribute("aria-pressed") !== "true";
    event.currentTarget.setAttribute("aria-pressed", String(value));
    viewer?.setWireframe(value);
  });

  document.querySelector("#reset-view").addEventListener("click", () => {
    viewer?.reset();
  });

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", () => copyText(button.dataset.copy));
  });
}

async function initialize() {
  bindEvents();
  viewer = new ModelViewer(document.querySelector("#model-stage"));
  backgroundPlayer = new BackgroundPlayer(
    document.querySelector("#background-stage"),
  );

  try {
    const [
      manifestResponse,
      modelsResponse,
      componentsResponse,
      imagesResponse,
      backgroundsResponse,
    ] =
      await Promise.all([
        fetch(catalogUrl("./manifest.json")),
        fetch(catalogUrl("./models.json")),
        fetch(catalogUrl("./components-index.json")),
        fetch(catalogUrl("./image-assets.json")),
        fetch(catalogUrl("./animated-backgrounds.json")),
      ]);
    if (
      !manifestResponse.ok ||
      !modelsResponse.ok ||
      !componentsResponse.ok ||
      !imagesResponse.ok ||
      !backgroundsResponse.ok
    ) {
      throw new Error("One or more MCP catalog files could not be loaded.");
    }

    const [manifest, models, components, images, backgrounds] = await Promise.all([
      manifestResponse.json(),
      modelsResponse.json(),
      componentsResponse.json(),
      imagesResponse.json(),
      backgroundsResponse.json(),
    ]);
    state.models = models;
    state.components = components;
    state.images = images;
    state.backgrounds = backgrounds;

    if (componentPreviewCount !== 85) {
      console.warn(
        `Expected 85 component preview archetypes, found ${componentPreviewCount}.`,
      );
    }

    document.querySelectorAll('[data-stat="models"]').forEach((element) => {
      element.textContent = formatCount(manifest.totals.models);
    });
    document.querySelectorAll('[data-stat="components"]').forEach((element) => {
      element.textContent = formatCount(manifest.totals.componentRecipes);
    });
    document.querySelectorAll('[data-stat="images"]').forEach((element) => {
      element.textContent = formatCount(manifest.totals.imageAssets);
    });
    document
      .querySelectorAll('[data-stat="backgrounds"]')
      .forEach((element) => {
        element.textContent = formatCount(manifest.totals.animatedBackgrounds);
      });
    document
      .querySelectorAll('[data-stat="local-models"]')
      .forEach((element) => {
        element.textContent = formatCount(manifest.totals.localModels);
      });

    const route = readInitialRoute();
    const defaultModel =
      models.find(
        (model) => model.id === "kenney-city-commercial-building-a",
      ) ?? models[0];
    const defaultComponent =
      components.find(
        (component) =>
          component.id === "reactive-dot-lattice--neo-industrial",
      ) ?? components[0];
    const defaultBackground =
      backgrounds.find(
        (background) => background.id === "animated-background-001",
      ) ?? backgrounds[0];
    const defaultImage =
      images.find(
        (image) => image.id === "open-doodles-coffee",
      ) ?? images[0];
    state.selectedModelId =
      route.view === "models" && models.some((model) => model.id === route.id)
        ? route.id
        : defaultModel.id;
    state.selectedComponentId =
      route.view === "components" &&
      components.some((component) => component.id === route.id)
        ? route.id
        : defaultComponent.id;
    state.selectedImageId =
      route.view === "images" &&
      images.some((image) => image.id === route.id)
        ? route.id
        : defaultImage.id;
    state.selectedBackgroundId =
      route.view === "backgrounds" &&
      backgrounds.some((background) => background.id === route.id)
        ? route.id
        : defaultBackground.id;

    setView(route.view, { updateLocation: false });
    if (route.view === "models") {
      await selectModel(state.selectedModelId, { updateLocation: false });
    }
    if (route.view === "components") {
      await selectComponent(state.selectedComponentId, {
        updateLocation: false,
      });
    }
    if (route.view === "images") {
      await selectImage(state.selectedImageId, {
        updateLocation: false,
      });
    }
    if (route.view === "backgrounds") {
      await selectBackground(state.selectedBackgroundId, {
        updateLocation: false,
      });
    }
  } catch (error) {
    elements.catalogGrid.innerHTML = `
      <div class="empty-state" role="alert">
        <strong>Catalog unavailable</strong>
        <span>${escapeHtml(error.message)}</span>
      </div>
    `;
    elements.catalogCount.textContent = "Loading failed";
    showToast(error.message);
  }
}

initialize();
