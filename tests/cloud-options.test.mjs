import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS, MASK_OPTIONS, PALETTE_OPTIONS, WORD_COUNT_OPTIONS, normalizeSettings } from "../app/lib/cloud-options.mjs";
import { canMovePalette, getPaletteNavigationTarget } from "../app/lib/palette-navigation.mjs";

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

test("offers six palettes and starts arrow comparison from the leftmost palette", () => {
  assert.deepEqual(PALETTE_OPTIONS.map(({ id }) => id), ["classroom", "clear", "warm", "rainbow", "violet", "spring"]);
  assert.equal(getPaletteNavigationTarget("clear", 1, false), "classroom");
  assert.equal(getPaletteNavigationTarget("classroom", 1, true), "clear");
  assert.equal(getPaletteNavigationTarget("clear", -1, true), "classroom");
  assert.equal(getPaletteNavigationTarget("spring", 1, true), "spring");
  assert.equal(canMovePalette("classroom", -1, true), false);
  assert.equal(canMovePalette("spring", 1, true), false);
  assert.equal(canMovePalette("clear", -1, false), true);
});
