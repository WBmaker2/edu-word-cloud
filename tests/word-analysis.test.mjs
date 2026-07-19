import assert from "node:assert/strict";
import test from "node:test";
import { analyzeText, parseList } from "../app/lib/word-analysis.mjs";

test("counts Korean and English words while removing stop words", () => {
  const result = analyzeText({
    text: "환경 환경 그리고 실천 Learning learning",
    excludedWords: [],
    keywords: [],
    limit: 40,
  });
  assert.deepEqual(result.words.map(({ text, count }) => [text, count]), [
    ["환경", 2],
    ["learning", 2],
    ["실천", 1],
  ]);
  assert.equal(result.error, null);
});

test("removes custom exclusions and boosts up to three keywords", () => {
  const result = analyzeText({
    text: "환경 환경 실천 약속 약속 우리",
    excludedWords: ["우리"],
    keywords: ["실천", "약속", "환경"],
    limit: 20,
  });
  assert.deepEqual(result.words.map(({ text }) => text), ["실천", "약속", "환경"]);
  assert.ok(result.words[0].weight > result.words[1].weight);
});

test("reports empty, insufficient, and truncated input", () => {
  assert.equal(analyzeText({ text: "", excludedWords: [], keywords: [], limit: 40 }).error, "empty");
  assert.equal(analyzeText({ text: "나", excludedWords: [], keywords: [], limit: 40 }).error, "insufficient");
  const result = analyzeText({ text: `환경 ${"가".repeat(50010)}`, excludedWords: [], keywords: [], limit: 40 });
  assert.equal(result.truncated, true);
  assert.equal(result.sourceLength, 50000);
});

test("parses comma and newline separated lists without duplicates", () => {
  assert.deepEqual(parseList("환경, 실천\n환경"), ["환경", "실천"]);
});
