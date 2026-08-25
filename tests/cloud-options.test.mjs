import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS, FONT_OPTIONS, MASK_OPTIONS, PALETTE_OPTIONS, WORD_COUNT_OPTIONS, normalizeSettings } from "../app/lib/cloud-options.mjs";
import { canMovePalette, getPaletteNavigationTarget } from "../app/lib/palette-navigation.mjs";

test("offers the approved masks and word counts with forty as default", () => {
  assert.deepEqual(
    MASK_OPTIONS.map(({ id, label }) => [id, label]),
    [
      ["circle", "원"], ["bubble", "말풍선"], ["heart", "하트"],
      ["star", "별"], ["book", "책"], ["butterfly", "나비"],
      ["leaf", "나뭇잎"], ["lightbulb", "전구"], ["cloud", "구름"],
    ],
  );
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

test("offers five readable font choices including the two child-friendly Korean fonts", () => {
  assert.deepEqual(FONT_OPTIONS.map(({ id, label }) => [id, label]), [
    ["clean", "깔끔한 고딕"],
    ["strong", "힘 있는 고딕"],
    ["serif", "부드러운 명조"],
    ["jua", "동글동글 주아"],
    ["gowun", "또박또박 고운돋움"],
  ]);
  assert.equal(FONT_OPTIONS.find(({ id }) => id === "jua")?.weight, 400);
  assert.equal(FONT_OPTIONS.find(({ id }) => id === "gowun")?.weight, 400);
});
