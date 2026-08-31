import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("prepares repository-subpath-safe static pages", async () => {
  const outputRoot = new URL("../.static-build/", import.meta.url);
  const html = await readFile(new URL("index.html", outputRoot), "utf8");

  assert.match(html, /href="\.\/assets\//);
  assert.match(html, /import\("\.\/assets\//);
  assert.match(html, /href="\.\/favicon\.svg"/);
  assert.doesNotMatch(html, /(?:src|href)="\/assets\//);
  assert.doesNotMatch(html, /(?:src|href)="\/favicon\.svg"/);
  assert.doesNotMatch(html, /["\\]\/assets\//);
  assert.doesNotMatch(html, /["\\]\/favicon\.svg/);
  await access(new URL("favicon.svg", outputRoot));
});
