import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  componentPreviewCount,
  componentPreviewMarkup,
} from "./component-previews.js";

const PAGE_SIZE = 30;
const publicRoot = "https://lumoraofficial.de/mcp";

const state = {
  view: "models",
  models: [],
  components: [],
  componentRecords: null,
  selectedModelId: null,
  selectedComponentId: null,
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
  toast: document.querySelector("#toast"),
};

let toastTimer = null;
let viewer = null;

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

function currentDataset() {
  return state.view === "models" ? state.models : state.components;
}

function fieldConfiguration() {
  if (state.view === "models") {
    return {
      primary: "source",
      primaryLabel: "Source",
      secondary: "collection",
      secondaryLabel: "Collection",
    };
  }
  return {
    primary: "impact",
    primaryLabel: "Impact",
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
          <span>${escapeHtml(value)}</span>
          <span>${String(count).padStart(3, "0")}</span>
        </button>
      `,
    )
    .join("");
}

function renderFilters() {
  const config = fieldConfiguration();
  elements.primaryLabel.textContent = config.primaryLabel;
  elements.secondaryLabel.textContent = config.secondaryLabel;
  elements.primaryFilter.innerHTML = filterOptionsMarkup(
    optionCounts(config.primary),
    state.primary,
    "primary",
  );
  elements.categoryFilter.innerHTML = filterOptionsMarkup(
    optionCounts("category"),
    state.category,
    "category",
  );
  elements.secondaryFilter.innerHTML = filterOptionsMarkup(
    optionCounts(config.secondary),
    state.secondary,
    "secondary",
  );
  elements.rightsCard.hidden = state.view !== "models";
}

function filteredRecords() {
  const config = fieldConfiguration();
  const query = normalized(state.query);
  const dataset = currentDataset().filter((record) => {
    const matchesPrimary =
      state.primary === "All" || record[config.primary] === state.primary;
    const matchesCategory =
      state.category === "All" || record.category === state.category;
    const matchesSecondary =
      state.secondary === "All" ||
      record[config.secondary] === state.secondary;

    const searchable =
      state.view === "models"
        ? [
            record.name,
            record.source,
            record.collection,
            record.category,
            record.creator,
            ...(record.tags ?? []),
          ]
        : [
            record.name,
            record.category,
            record.art_direction,
            record.summary,
            record.style_tags,
            record.best_for,
            record.framework_fit,
          ];
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
      if (left.source !== right.source) return left.source === "Kenney" ? -1 : 1;
      if (left.storage !== right.storage) return left.storage === "local" ? -1 : 1;
      return left.name.localeCompare(right.name);
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

function componentCard(record) {
  const archetype = record.id.split("--")[0];
  return `
    <button
      type="button"
      role="listitem"
      class="component-card${state.selectedComponentId === record.id ? " is-selected" : ""}"
      data-record-id="${escapeHtml(record.id)}"
      data-direction="${escapeHtml(record.art_direction)}"
      data-archetype="${escapeHtml(archetype)}"
      aria-label="Inspect ${escapeHtml(record.name)}"
      aria-pressed="${state.selectedComponentId === record.id}"
    >
      <span class="component-card-visual">
        ${componentPreviewMarkup(record)}
        <span class="component-visual-label">${escapeHtml(record.art_direction)}</span>
      </span>
      <span class="card-copy">
        <h3>${escapeHtml(record.name)}</h3>
        <p>${escapeHtml(record.summary)}</p>
        <span class="card-meta">
          <span>Q${record.quality_score}</span>
          <span>N${record.novelty_score}</span>
          <span>${escapeHtml(record.category)}</span>
        </span>
      </span>
    </button>
  `;
}

function renderCatalog() {
  if (state.view === "integration") return;
  const records = filteredRecords();
  const visible = records.slice(0, state.visibleCount);
  const noun = state.view === "models" ? "objects" : "recipes";

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
      ? "Kenney + Poly Haven"
      : "12 original art directions";
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
        <span>Try a broader term, category, or collection.</span>
      </div>
    `;
    return;
  }

  elements.catalogGrid.innerHTML = visible
    .map(state.view === "models" ? modelCard : componentCard)
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
  const response = await fetch("./components.json");
  if (!response.ok) throw new Error("Complete component records are unavailable.");
  const records = await response.json();
  state.componentRecords = new Map(records.map((record) => [record.id, record]));
  return state.componentRecords;
}

function renderComponentInspector(record) {
  document.querySelector("#component-name").textContent = record.name;
  document.querySelector("#component-score").textContent =
    `Q${record.quality_score} / N${record.novelty_score}`;
  const stage = document.querySelector("#component-stage");
  stage.dataset.direction = record.art_direction;
  stage.dataset.archetype = record.id.split("--")[0];
  stage.innerHTML = `
    ${componentPreviewMarkup(record)}
    <span class="component-visual-label">${escapeHtml(record.art_direction.toUpperCase())}</span>
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
    `Read the Lumora MCP component record "${record.id}" at ` +
    `${publicRoot}/components.json. Implement it from first principles in this ` +
    `project's framework and brand. Preserve its content, responsive, ` +
    `accessibility, fallback, performance, and test contracts.`;
  document.querySelector("#component-prompt").textContent = prompt;
  document.querySelector("#component-prompt").dataset.prompt = prompt;
  document.querySelector("#component-record-link").href =
    `./components.json#${encodeURIComponent(record.id)}`;
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

function resetFilters() {
  state.query = "";
  state.primary = "All";
  state.category = "All";
  state.secondary = "All";
  state.visibleCount = PAGE_SIZE;
  elements.search.value = "";
}

function setView(view, { updateLocation = true } = {}) {
  if (!["models", "components", "integration"].includes(view)) return;
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

  if (integration) {
    if (updateLocation) history.replaceState(null, "", "#protocol");
    return;
  }

  elements.modelInspector.hidden = view !== "models";
  elements.componentInspector.hidden = view !== "components";
  elements.catalogKicker.textContent =
    view === "models"
      ? "3D INDEX / WEB READY"
      : "COMPONENT INDEX / OWNED ORIGINAL";

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
}

function readInitialRoute() {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  if (hash === "protocol") return { view: "integration", id: null };
  const [type, ...idParts] = hash.split("/");
  const id = idParts.join("/");
  if (type === "components" && id) return { view: "components", id };
  if (type === "models" && id) return { view: "models", id };
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
          this.mixer.clipAction(gltf.animations[0]).play();
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
  });

  elements.loadMore.addEventListener("click", () => {
    state.visibleCount += PAGE_SIZE;
    renderCatalog();
  });

  document.querySelector("#copy-model-url").addEventListener("click", () => {
    const record = state.models.find(
      (model) => model.id === state.selectedModelId,
    );
    if (record) copyText(record.publicModelUrl, "Model URL copied");
  });

  document
    .querySelector("#copy-component-prompt")
    .addEventListener("click", () => {
      const prompt = document.querySelector("#component-prompt").dataset.prompt;
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

  try {
    const [manifestResponse, modelsResponse, componentsResponse] =
      await Promise.all([
        fetch("./manifest.json"),
        fetch("./models.json"),
        fetch("./components-index.json"),
      ]);
    if (
      !manifestResponse.ok ||
      !modelsResponse.ok ||
      !componentsResponse.ok
    ) {
      throw new Error("One or more MCP catalog files could not be loaded.");
    }

    const [manifest, models, components] = await Promise.all([
      manifestResponse.json(),
      modelsResponse.json(),
      componentsResponse.json(),
    ]);
    state.models = models;
    state.components = components;

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
    state.selectedModelId =
      route.view === "models" && models.some((model) => model.id === route.id)
        ? route.id
        : defaultModel.id;
    state.selectedComponentId =
      route.view === "components" &&
      components.some((component) => component.id === route.id)
        ? route.id
        : defaultComponent.id;

    setView(route.view, { updateLocation: false });
    if (route.view === "models") {
      await selectModel(state.selectedModelId, { updateLocation: false });
    }
    if (route.view === "components") {
      await selectComponent(state.selectedComponentId, {
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
