import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("renders a fixed-size accessible canvas with PNG download support", async () => {
  const canvasSource = await readFile(
    new URL("../app/components/CloudCanvas.tsx", import.meta.url),
    "utf8",
  );

  assert.match(canvasSource, /width=\{1200\}/);
  assert.match(canvasSource, /height=\{800\}/);
  assert.match(canvasSource, /toBlob/);
  assert.match(canvasSource, /클라우드-수업실-/);
  assert.match(canvasSource, /aria-label="워드 클라우드 미리보기"/);
  assert.match(canvasSource, /result\.words\.slice\(0, settings\.wordCount\)/);
  assert.match(canvasSource, /\[result, settings\.maskId, settings\.wordCount\]/);
});

test("reports PNG download failures when browser download APIs are unsupported or throw", async () => {
  const canvasSource = await readFile(
    new URL("../app/components/CloudCanvas.tsx", import.meta.url),
    "utf8",
  );

  assert.match(canvasSource, /typeof canvas\.toBlob !== "function"/);
  assert.match(canvasSource, /typeof urlApi\.createObjectURL !== "function"/);
  assert.match(canvasSource, /typeof urlApi\.revokeObjectURL !== "function"/);
  assert.match(canvasSource, /typeof link\.click !== "function"/);
  assert.match(canvasSource, /try\s*\{\s*canvas\.toBlob\(/s);
  assert.match(canvasSource, /catch\s*\{\s*onDownloadError\(\);\s*\}/s);
});
