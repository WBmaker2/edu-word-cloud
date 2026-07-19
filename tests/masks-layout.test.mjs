import assert from "node:assert/strict";
import test from "node:test";
import { MASK_IDS, isInsideMask } from "../app/lib/masks.mjs";
import { layoutWords } from "../app/lib/cloud-layout.mjs";

test("all five masks include the center and reject far corners", () => {
  assert.deepEqual(MASK_IDS, ["circle", "bubble", "heart", "star", "book"]);
  for (const mask of MASK_IDS) {
    assert.equal(isInsideMask(mask, 0, 0), true, mask);
    assert.equal(isInsideMask(mask, 0.99, 0.99), false, mask);
  }
});

test("layout is deterministic and remains inside the selected mask", () => {
  const words = [
    { text: "환경", count: 8, weight: 8 },
    { text: "실천", count: 6, weight: 6 },
    { text: "약속", count: 4, weight: 4 },
  ];
  const first = layoutWords({
    words,
    maskId: "heart",
    width: 1200,
    height: 800,
    seed: "환경-수업",
  });
  const second = layoutWords({
    words,
    maskId: "heart",
    width: 1200,
    height: 800,
    seed: "환경-수업",
  });

  assert.deepEqual(first, second);
  assert.equal(first.placed.length, 3);
  for (const word of first.placed) {
    assert.equal(isInsideMask("heart", word.nx, word.ny), true);
  }
});
