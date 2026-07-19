import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS, MASK_OPTIONS, WORD_COUNT_OPTIONS, normalizeSettings } from "../app/lib/cloud-options.mjs";

test("offers the approved masks and word counts with forty as default", () => {
  assert.deepEqual(MASK_OPTIONS.map(({ id }) => id), ["circle", "bubble", "heart", "star", "book"]);
  assert.deepEqual(WORD_COUNT_OPTIONS, [20, 40, 60, 80, 100]);
  assert.equal(DEFAULT_SETTINGS.wordCount, 40);
});

test("normalizes unknown saved preferences to safe defaults", () => {
  assert.deepEqual(normalizeSettings({ maskId: "unknown", paletteId: "warm", fontId: "clean", wordCount: 999 }), {
    ...DEFAULT_SETTINGS,
    paletteId: "warm",
  });
});
