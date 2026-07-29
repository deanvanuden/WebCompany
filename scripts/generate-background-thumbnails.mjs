import { spawn } from "node:child_process";
import {
  access,
  mkdir,
  readFile,
  rename,
  rm,
  stat,
} from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const sourcePath = path.join(
  scriptDirectory,
  "data",
  "animated-backgrounds-source.json",
);
const outputRoot = path.join(
  repositoryRoot,
  "mcp",
  "assets",
  "background-thumbs",
);
const ffmpegPath = process.env.FFMPEG_PATH ?? "ffmpeg";
const concurrency = Math.max(
  1,
  Math.min(8, Number(process.env.THUMBNAIL_CONCURRENCY ?? 4)),
);
const force = process.env.THUMBNAIL_FORCE === "1";

async function fileExists(filePath) {
  try {
    await access(filePath);
    return (await stat(filePath)).size > 0;
  } catch {
    return false;
  }
}

function runFfmpeg(entry, targetPath, timestamp) {
  const temporaryPath = `${targetPath}.tmp.webp`;
  const args = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-nostdin",
    "-user_agent",
    "Lumora-MCP/1.0",
    "-i",
    entry.url,
    "-ss",
    timestamp,
    "-frames:v",
    "1",
    "-an",
    "-vf",
    "scale=640:360:force_original_aspect_ratio=increase,crop=640:360",
    "-c:v",
    "libwebp",
    "-quality",
    "80",
    "-compression_level",
    "4",
    "-y",
    temporaryPath,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, {
      windowsHide: true,
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
    }, 45_000);

    child.stderr.on("data", (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-4_000);
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", async (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        await rm(temporaryPath, { force: true });
        reject(
          new Error(
            stderr.trim() || `ffmpeg stopped with exit code ${String(code)}`,
          ),
        );
        return;
      }

      await rm(targetPath, { force: true });
      await rename(temporaryPath, targetPath);
      resolve();
    });
  });
}

async function generateThumbnail(entry) {
  const sequence = String(entry.sourceIndex).padStart(3, "0");
  const targetPath = path.join(
    outputRoot,
    `animated-background-${sequence}.webp`,
  );
  if (!force && (await fileExists(targetPath))) {
    return { status: "existing", entry };
  }

  try {
    await runFfmpeg(entry, targetPath, "0.10");
    return { status: "generated", entry };
  } catch (firstError) {
    try {
      await runFfmpeg(entry, targetPath, "0");
      return { status: "generated", entry };
    } catch (secondError) {
      return {
        status: "failed",
        entry,
        error: `${firstError.message}\nRetry: ${secondError.message}`,
      };
    }
  }
}

async function main() {
  const source = JSON.parse(await readFile(sourcePath, "utf8"));
  const entries = source.entries.filter((entry) => entry.available);
  await mkdir(outputRoot, { recursive: true });

  const results = new Array(entries.length);
  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (cursor < entries.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await generateThumbnail(entries[index]);
      completed += 1;
      if (
        completed === entries.length ||
        completed % 10 === 0 ||
        results[index].status === "failed"
      ) {
        console.log(
          `Background thumbnails: ${completed}/${entries.length} processed`,
        );
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, entries.length) }, () =>
      worker(),
    ),
  );

  const summary = {
    sourceCount: source.uniqueUrlCount,
    availableSources: entries.length,
    generated: results.filter((result) => result.status === "generated").length,
    existing: results.filter((result) => result.status === "existing").length,
    failed: results.filter((result) => result.status === "failed").length,
  };
  console.log(JSON.stringify(summary, null, 2));

  const failures = results.filter((result) => result.status === "failed");
  for (const failure of failures) {
    console.error(
      `${failure.entry.sourceIndex}: ${failure.entry.url}\n${failure.error}`,
    );
  }
  if (failures.length) process.exitCode = 1;
}

await main();
