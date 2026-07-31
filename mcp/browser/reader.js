const SOURCE_MAP = {
  manifest: { label: "Manifest", path: "../manifest.json", type: "json" },
  instructions: {
    label: "Codex instructions",
    path: "../instructions.md",
    type: "text",
  },
  models: { label: "3D model records", path: "../models.json", type: "catalog" },
  "component-index": {
    label: "Component discovery index",
    path: "../components-index.json",
    type: "catalog",
  },
  components: {
    label: "Complete component records",
    path: "../components.json",
    type: "catalog",
  },
  "origin-kit": {
    label: "OriginKit snapshot",
    path: "../originkit-components.json",
    type: "catalog",
  },
  "react-bits": {
    label: "React Bits snapshot",
    path: "../react-bits-components.json",
    type: "catalog",
  },
  "canvas-ui": {
    label: "Canvas UI snapshot",
    path: "../canvas-ui-components.json",
    type: "catalog",
  },
  pmndrs: {
    label: "pmndrs examples",
    path: "../pmndrs-examples.json",
    type: "catalog",
  },
  "arlan-vault": {
    label: "Arlan's Vault",
    path: "../arlan-vault.json",
    type: "catalog",
  },
  images: {
    label: "Images / UI records",
    path: "../image-assets.json",
    type: "catalog",
  },
  backgrounds: {
    label: "Animated backgrounds",
    path: "../animated-backgrounds.json",
    type: "catalog",
  },
  provenance: {
    label: "Provenance",
    path: "../provenance.json",
    type: "json",
  },
};

const params = new URLSearchParams(window.location.search);
const requestedSource = params.get("source") ?? "protocol";
const sourceKey = requestedSource === "protocol" || SOURCE_MAP[requestedSource]
  ? requestedSource
  : "protocol";
const exactId = (params.get("id") ?? "").trim();
const query = (params.get("q") ?? "").trim();

const form = document.querySelector("#reader-form");
const sourceSelect = document.querySelector("#source-select");
const recordIdInput = document.querySelector("#record-id");
const queryInput = document.querySelector("#reader-query");
const output = document.querySelector("#reader-output");
const status = document.querySelector("#reader-status");
const outputTitle = document.querySelector("#output-title");
const outputKicker = document.querySelector("#output-kicker");
const rawEndpoint = document.querySelector("#raw-endpoint");
const copyButton = document.querySelector("#copy-output");

sourceSelect.value = sourceKey;
recordIdInput.value = exactId;
queryInput.value = query;

function absoluteUrl(path) {
  return new URL(path, window.location.href).href;
}

async function readResponse(source) {
  const response = await fetch(source.path, {
    headers: {
      Accept: source.type === "text" ? "text/markdown,text/plain" : "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} while reading ${source.path}`);
  }
  return source.type === "text" ? response.text() : response.json();
}

function catalogRecords(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  const arrays = Object.entries(data)
    .filter(([, value]) => Array.isArray(value))
    .sort((left, right) => right[1].length - left[1].length);
  return arrays[0]?.[1] ?? [];
}

function catalogMetadata(data) {
  if (Array.isArray(data) || !data || typeof data !== "object") return null;
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => !Array.isArray(value)),
  );
}

function matchesRecord(record) {
  if (exactId && String(record?.id ?? "").toLowerCase() !== exactId.toLowerCase()) {
    return false;
  }
  if (!query) return true;
  return JSON.stringify(record).toLowerCase().includes(query.toLowerCase());
}

function formatCatalog(data, source) {
  const records = catalogRecords(data);
  const matches = records.filter(matchesRecord);
  const limit = exactId ? 1 : 20;
  const visible = matches.slice(0, limit);
  const heading = [
    `LUMORA MCP · ${source.label.toUpperCase()}`,
    `RAW ENDPOINT: ${absoluteUrl(source.path)}`,
    `TOTAL RECORDS: ${records.length}`,
    `MATCHING RECORDS: ${matches.length}`,
    `VISIBLE RECORDS: ${visible.length}`,
    exactId ? `EXACT ID: ${exactId}` : null,
    query ? `SEARCH: ${query}` : null,
    "SELECTION POLICY: UNRESTRICTED — metadata is descriptive; Codex controls all usage.",
  ].filter(Boolean);

  const metadata = catalogMetadata(data);
  const body = visible.length
    ? JSON.stringify(visible, null, 2)
    : "No matching records. Change the exact ID or metadata search and try again.";

  return [
    heading.join("\n"),
    metadata ? `SOURCE METADATA\n${JSON.stringify(metadata, null, 2)}` : null,
    `RECORDS\n${body}`,
  ]
    .filter(Boolean)
    .join("\n\n────────────────────────────────────────────────────────────\n\n");
}

async function renderProtocol() {
  const manifestSource = SOURCE_MAP.manifest;
  const instructionsSource = SOURCE_MAP.instructions;
  const [manifest, instructions] = await Promise.all([
    readResponse(manifestSource),
    readResponse(instructionsSource),
  ]);

  outputTitle.textContent = "Catalog protocol";
  outputKicker.textContent = "MANIFEST + CODEX INSTRUCTIONS";
  rawEndpoint.textContent = absoluteUrl(manifestSource.path);
  status.textContent = `Live · Lumora MCP ${manifest.version ?? "current"}`;

  return [
    "LUMORA MCP · BROWSER-READABLE FIRST-PARTY PROTOCOL",
    "This HTML view contains the same live data as the raw endpoints.",
    "Selection policy: UNRESTRICTED. Lumora imposes no usage rules.",
    `MANIFEST\n${JSON.stringify(manifest, null, 2)}`,
    `CODEX INSTRUCTIONS\n${instructions}`,
  ].join("\n\n════════════════════════════════════════════════════════════\n\n");
}

async function renderSource(source) {
  const data = await readResponse(source);
  outputTitle.textContent = source.label;
  outputKicker.textContent = source.type === "catalog" ? "FILTERED RECORD VIEW" : "FIRST-PARTY SOURCE";
  rawEndpoint.textContent = absoluteUrl(source.path);
  status.textContent = `Live · ${absoluteUrl(source.path)}`;

  if (source.type === "text") return data;
  if (source.type === "catalog") return formatCatalog(data, source);
  return JSON.stringify(data, null, 2);
}

async function loadReader() {
  output.setAttribute("aria-busy", "true");
  output.removeAttribute("data-error");

  try {
    output.textContent = sourceKey === "protocol"
      ? await renderProtocol()
      : await renderSource(SOURCE_MAP[sourceKey]);
  } catch (error) {
    output.dataset.error = "true";
    output.textContent = [
      "LUMORA MCP READER ERROR",
      error instanceof Error ? error.message : String(error),
      "The raw endpoint remains available to direct HTTP clients.",
    ].join("\n\n");
    status.textContent = "Unable to load source";
  } finally {
    output.setAttribute("aria-busy", "false");
  }
}

form.addEventListener("submit", () => {
  const selected = sourceSelect.value;
  if (selected === "protocol" || ["manifest", "instructions", "provenance"].includes(selected)) {
    recordIdInput.value = "";
    queryInput.value = "";
  }
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(output.textContent);
    copyButton.textContent = "Copied";
    copyButton.dataset.copied = "true";
    window.setTimeout(() => {
      copyButton.textContent = "Copy visible data";
      delete copyButton.dataset.copied;
    }, 1800);
  } catch {
    copyButton.textContent = "Copy unavailable";
  }
});

loadReader();
