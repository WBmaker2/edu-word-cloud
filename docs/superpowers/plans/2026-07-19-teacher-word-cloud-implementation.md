# 교사용 워드 클라우드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 교사가 학생 답변을 기기 안에서 분석해 다섯 가지 마스크의 워드 클라우드로 만들고 PNG로 저장하는 무광고 단일 페이지 사이트를 구축한다.

**Architecture:** React 클라이언트 컴포넌트가 입력과 설정 상태를 관리하고, 순수 JavaScript 모듈이 텍스트 분석·마스크 판정·결정적 단어 배치를 담당한다. Canvas 컴포넌트는 계산된 배치 결과를 화면과 1200×800 PNG에 동일하게 렌더링하며 입력 원문은 브라우저 저장소에 기록하지 않는다.

**Tech Stack:** React 19, Next 16 호환 vinext, JavaScript ES modules with JSDoc, Canvas 2D, CSS, Node.js built-in test runner, OpenAI Sites hosting

## Global Constraints

- 회원가입, 광고, 공개 갤러리, 외부 분석 API를 사용하지 않는다.
- 입력 텍스트와 분석 결과는 서버에 전송하거나 영구 저장하지 않는다.
- 마스크는 원, 말풍선, 하트, 별, 책 다섯 개만 제공한다.
- 단어 수 선택지는 20개, 40개, 60개, 80개, 100개이며 기본값은 40개다.
- 색상은 교실 초록, 맑은 파랑, 따뜻한 주황, 다채로운 무지개 네 종류다.
- 글꼴은 깔끔한 고딕, 힘 있는 고딕, 부드러운 명조 세 종류다.
- 코드 파일은 모두 500줄 미만으로 유지한다.
- `업데이트 내역`에 `2026-07-19 — 교사용 워드 클라우드 사이트 첫 제작`을 표시한다.
- 빈 입력, 의미 있는 단어 부족, 50,000자 초과, 공간 부족, 저장 실패를 한국어로 안내한다.
- 데스크톱과 모바일에서 키보드 접근과 명확한 포커스 표시를 제공한다.

---

## File Map

- `app/lib/word-analysis.mjs`: 입력 제한, 토큰화, 불용어·사용자 제외어 제거, 핵심어 가중치, 빈도 정렬
- `app/lib/masks.mjs`: 다섯 마스크의 내부 좌표 판정과 마스크 외곽선 경로
- `app/lib/cloud-layout.mjs`: 결정적 난수, 충돌 검사, 나선 탐색, 배치 생략 정보
- `app/lib/cloud-options.mjs`: 색상·글꼴·단어 수 상수와 설정 정규화
- `app/components/CloudCanvas.tsx`: 미리보기 Canvas 렌더링과 PNG 저장 인터페이스
- `app/components/QuickSettings.tsx`: 마스크·색상·글꼴·단어 수 설정
- `app/components/TextWorkspace.tsx`: 텍스트·예시·제외어·핵심어 입력과 오류 안내
- `app/components/WordFrequency.tsx`: 상위 단어 빈도표
- `app/components/InfoDialog.tsx`: 도움말과 업데이트 내역 대화상자
- `app/WordCloudStudio.tsx`: 전체 상태와 생성 흐름 조립
- `app/page.tsx`: 완성된 페이지 진입점과 페이지 메타데이터
- `app/layout.tsx`: 한국어 문서 언어와 사이트 메타데이터
- `app/globals.css`: 큰 미리보기 중심 반응형 디자인
- `tests/word-analysis.test.mjs`: 분석 모듈 단위 테스트
- `tests/masks-layout.test.mjs`: 마스크·배치 모듈 단위 테스트
- `tests/rendered-html.test.mjs`: 완성 페이지 서버 렌더링 계약

---

### Task 1: 텍스트 분석 계약

**Files:**
- Create: `tests/word-analysis.test.mjs`
- Create: `app/lib/word-analysis.mjs`

**Interfaces:**
- Consumes: `{ text, excludedWords, keywords, limit }`
- Produces: `analyzeText(options) -> { words, sourceLength, truncated, error }`
- Produces: `parseList(value) -> string[]`

- [ ] **Step 1: Write the failing analysis tests**

```js
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
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test tests/word-analysis.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `app/lib/word-analysis.mjs`.

- [ ] **Step 3: Implement the analysis module**

Implement these exact exports in `app/lib/word-analysis.mjs`:

```js
export const MAX_TEXT_LENGTH = 50_000;
export const DEFAULT_STOP_WORDS = new Set([
  "그리고", "그러나", "하지만", "또한", "우리", "저는", "나는", "있다", "하다", "하는", "했다",
  "the", "and", "for", "with", "that", "this", "from",
]);

export function parseList(value) {
  return [...new Set(value.split(/[\n,]/).map((word) => word.trim().toLowerCase()).filter(Boolean))];
}

export function analyzeText({ text, excludedWords = [], keywords = [], limit = 40 }) {
  const normalizedSource = text.slice(0, MAX_TEXT_LENGTH);
  const truncated = text.length > MAX_TEXT_LENGTH;
  if (!normalizedSource.trim()) return { words: [], sourceLength: 0, truncated, error: "empty" };

  const exclusions = new Set([...DEFAULT_STOP_WORDS, ...excludedWords.map((word) => word.toLowerCase())]);
  const tokens = (normalizedSource.toLowerCase().match(/[가-힣a-z0-9]+/g) ?? [])
    .filter((word) => word.length > 1 && !/^\d+$/.test(word) && !exclusions.has(word));
  if (tokens.length === 0) return { words: [], sourceLength: normalizedSource.length, truncated, error: "insufficient" };

  const counts = new Map();
  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
  const keywordRanks = new Map(keywords.slice(0, 3).map((word, index) => [word.toLowerCase(), index]));
  const words = [...counts].map(([word, count]) => {
    const rank = keywordRanks.get(word);
    return { text: word, count, weight: rank === undefined ? count : Math.max(count, 8 - rank * 2), keywordRank: rank ?? null };
  }).sort((a, b) => b.weight - a.weight || b.count - a.count || a.text.localeCompare(b.text, "ko"));

  return { words: words.slice(0, limit), sourceLength: normalizedSource.length, truncated, error: null };
}
```

- [ ] **Step 4: Run the analysis tests and verify GREEN**

Run: `node --test tests/word-analysis.test.mjs`

Expected: 4 tests pass, 0 fail.

- [ ] **Step 5: Commit the analysis slice**

```bash
git add app/lib/word-analysis.mjs tests/word-analysis.test.mjs
git commit -m "feat: add private text analysis"
```

---

### Task 2: 마스크와 결정적 단어 배치

**Files:**
- Create: `tests/masks-layout.test.mjs`
- Create: `app/lib/masks.mjs`
- Create: `app/lib/cloud-layout.mjs`

**Interfaces:**
- Produces: `MASK_IDS = ["circle", "bubble", "heart", "star", "book"]`
- Produces: `isInsideMask(maskId, x, y) -> boolean`, where coordinates are normalized to `[-1, 1]`
- Consumes: `{ words, maskId, width, height, seed }`
- Produces: `layoutWords(options) -> { placed, omitted }`

- [ ] **Step 1: Write failing mask and layout tests**

```js
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
  const first = layoutWords({ words, maskId: "heart", width: 1200, height: 800, seed: "환경-수업" });
  const second = layoutWords({ words, maskId: "heart", width: 1200, height: 800, seed: "환경-수업" });
  assert.deepEqual(first, second);
  assert.equal(first.placed.length, 3);
  for (const word of first.placed) assert.equal(isInsideMask("heart", word.nx, word.ny), true);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/masks-layout.test.mjs`

Expected: FAIL with missing `masks.mjs` or `cloud-layout.mjs`.

- [ ] **Step 3: Implement five mask equations**

Implement `MASK_IDS` and `isInsideMask()` in `app/lib/masks.mjs`. Use these equations and bounds:

```js
export const MASK_IDS = ["circle", "bubble", "heart", "star", "book"];

export function isInsideMask(maskId, x, y) {
  if (Math.abs(x) > 1 || Math.abs(y) > 1) return false;
  if (maskId === "circle") return x * x + y * y <= 0.88;
  if (maskId === "bubble") return (x * x) / 0.92 + (y * y) / 0.64 <= 1 || (y > 0.45 && y < 0.9 && x > 0.2 && x < 0.72 - y * 0.35);
  if (maskId === "heart") {
    const hy = -y * 1.08 + 0.12;
    return (x * x + hy * hy - 0.68) ** 3 - x * x * hy ** 3 <= 0;
  }
  if (maskId === "star") {
    const angle = Math.atan2(y, x);
    const radius = Math.hypot(x, y);
    const edge = 0.53 + 0.27 * Math.cos(5 * angle);
    return radius <= edge;
  }
  if (maskId === "book") return Math.abs(x) <= 0.9 && Math.abs(y) <= 0.68 - 0.12 * Math.abs(x) && !(Math.abs(x) < 0.04 && Math.abs(y) > 0.58);
  return false;
}
```

- [ ] **Step 4: Implement deterministic spiral placement**

In `app/lib/cloud-layout.mjs`, export `layoutWords`. It must derive a stable 32-bit seed from the input string, size words from 30px to 112px, alternate no rotation and 90° rotation only for words after index 5, reject rectangles that overlap with 8px padding, sample the rectangle corners and center with `isInsideMask`, and return omitted words when 2,000 spiral attempts fail.

The returned shape is:

```js
{
  placed: [{ text, count, weight, x, y, nx, ny, fontSize, rotation, colorIndex }],
  omitted: [{ text, count, weight }],
}
```

- [ ] **Step 5: Run mask and layout tests and verify GREEN**

Run: `node --test tests/masks-layout.test.mjs`

Expected: 2 tests pass, 0 fail.

- [ ] **Step 6: Commit the geometry slice**

```bash
git add app/lib/masks.mjs app/lib/cloud-layout.mjs tests/masks-layout.test.mjs
git commit -m "feat: add classroom cloud masks"
```

---

### Task 3: 완성 페이지 계약과 설정 상수

**Files:**
- Modify: `tests/rendered-html.test.mjs`
- Create: `app/lib/cloud-options.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `MASK_OPTIONS`, `PALETTE_OPTIONS`, `FONT_OPTIONS`, `WORD_COUNT_OPTIONS`, `DEFAULT_SETTINGS`
- Produces: `normalizeSettings(value) -> CloudSettings`

- [ ] **Step 1: Replace starter assertions with failing product assertions**

The rendered HTML test must assert status 200 and these exact phrases:

```js
assert.match(html, /<title>클라우드 수업실/);
assert.match(html, /학생들의 생각을 한눈에 모아보세요/);
assert.match(html, /광고 없음/);
assert.match(html, /서버 저장 없음/);
assert.match(html, /워드 클라우드 만들기/);
assert.match(html, /업데이트 내역/);
assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/);
```

- [ ] **Step 2: Run the current integration test and verify RED**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: FAIL because the starter title and skeleton are still rendered.

- [ ] **Step 3: Add exact option constants and defaults**

Create `app/lib/cloud-options.mjs` with exact IDs and `DEFAULT_SETTINGS.wordCount = 40`:

```js
export const MASK_OPTIONS = [
  { id: "circle", label: "원", glyph: "●" },
  { id: "bubble", label: "말풍선", glyph: "▰" },
  { id: "heart", label: "하트", glyph: "♥" },
  { id: "star", label: "별", glyph: "★" },
  { id: "book", label: "책", glyph: "▤" },
];
export const PALETTE_OPTIONS = [
  { id: "classroom", label: "교실 초록", colors: ["#245a45", "#367b5d", "#d56c45", "#e2aa42", "#3f5f94"] },
  { id: "clear", label: "맑은 파랑", colors: ["#1f4fbf", "#3478d4", "#2b8f83", "#f08a5d", "#6b5fb5"] },
  { id: "warm", label: "따뜻한 주황", colors: ["#8f3f2c", "#c45f3e", "#e09145", "#6e7c4f", "#59433a"] },
  { id: "rainbow", label: "다채로운 무지개", colors: ["#d64545", "#e28b32", "#2f8a58", "#2873b8", "#7554a8"] },
];
export const FONT_OPTIONS = [
  { id: "clean", label: "깔끔한 고딕", family: "Arial, sans-serif", weight: 700 },
  { id: "strong", label: "힘 있는 고딕", family: "Arial Black, Arial, sans-serif", weight: 800 },
  { id: "serif", label: "부드러운 명조", family: "Georgia, serif", weight: 700 },
];
export const WORD_COUNT_OPTIONS = [20, 40, 60, 80, 100];
export const DEFAULT_SETTINGS = { maskId: "bubble", paletteId: "clear", fontId: "clean", wordCount: 40 };
```

Add `normalizeSettings` so unknown values fall back to `DEFAULT_SETTINGS` and only the four settings are returned.

- [ ] **Step 4: Remove the starter-only dependency**

Run: `npm uninstall react-loading-skeleton`

Expected: `react-loading-skeleton` is removed from `package.json` and `package-lock.json`.

- [ ] **Step 5: Add unit tests to the test script**

Set `package.json` scripts to:

```json
{
  "test:unit": "node --test tests/word-analysis.test.mjs tests/masks-layout.test.mjs",
  "test": "npm run test:unit && npm run build && node --test tests/rendered-html.test.mjs"
}
```

- [ ] **Step 6: Commit the product contract**

```bash
git add tests/rendered-html.test.mjs app/lib/cloud-options.mjs package.json package-lock.json
git commit -m "test: define word cloud product contract"
```

---

### Task 4: 큰 미리보기와 PNG 저장

**Files:**
- Create: `app/components/CloudCanvas.tsx`

**Interfaces:**
- Consumes: `{ result, settings, onDownloadError }`
- Produces: a responsive `<canvas>` and imperative PNG download button behavior

- [ ] **Step 1: Add a renderer contract test**

Extend `tests/rendered-html.test.mjs` source checks to read `CloudCanvas.tsx` and assert:

```js
assert.match(canvasSource, /width={1200}/);
assert.match(canvasSource, /height={800}/);
assert.match(canvasSource, /toBlob/);
assert.match(canvasSource, /클라우드-수업실-/);
assert.match(canvasSource, /aria-label="워드 클라우드 미리보기"/);
```

- [ ] **Step 2: Run and verify RED**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: FAIL because `CloudCanvas.tsx` does not exist.

- [ ] **Step 3: Implement the Canvas component**

`CloudCanvas.tsx` must be a client component. On result or settings change, it must clear a 1200×800 canvas, draw `#ffffff`, call `layoutWords`, and draw each placed word with the selected font, palette color, rotation, and centered text alignment. It must expose a `PNG 저장` button that uses `canvas.toBlob`, creates a temporary object URL, downloads `클라우드-수업실-YYYY-MM-DD.png`, revokes the URL, and calls `onDownloadError` when the blob is null.

When there is no result, draw a calm example cloud and show `텍스트를 붙여넣으면 여기에 결과가 나타나요.` as adjacent accessible text. Show `표시된 단어 N개 · 공간 부족으로 생략 M개` below a generated result.

- [ ] **Step 4: Build and verify the renderer contract**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: renderer source assertions pass; page product assertions remain red until Task 5.

- [ ] **Step 5: Commit the renderer**

```bash
git add app/components/CloudCanvas.tsx tests/rendered-html.test.mjs
git commit -m "feat: render downloadable word clouds"
```

---

### Task 5: 교사용 작업 화면

**Files:**
- Create: `app/components/QuickSettings.tsx`
- Create: `app/components/TextWorkspace.tsx`
- Create: `app/components/WordFrequency.tsx`
- Create: `app/components/InfoDialog.tsx`
- Create: `app/WordCloudStudio.tsx`
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Delete: `app/_sites-preview/SkeletonPreview.tsx`
- Delete: `app/_sites-preview/preview.css`

**Interfaces:**
- `QuickSettings({ settings, onChange })`
- `TextWorkspace({ text, excluded, keywords, error, truncated, onTextChange, onExcludedChange, onKeywordsChange, onGenerate })`
- `WordFrequency({ words })`
- `InfoDialog({ type, onClose })`
- `WordCloudStudio()` owns all state and local preference persistence

- [ ] **Step 1: Add source and rendered accessibility assertions**

Extend `tests/rendered-html.test.mjs` to verify source contains all five mask labels, all five word-count values, `aria-pressed`, `aria-live`, `dialog`, the three example labels, the dated update entry, and `localStorage.setItem("cloud-classroom-settings"`. Assert the source never stores the variables named `text`, `excluded`, `keywords`, or `result` in localStorage.

- [ ] **Step 2: Run and verify RED**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: FAIL on missing product UI and accessibility contracts.

- [ ] **Step 3: Implement focused UI components**

Implement the four UI components with native buttons, labels, textarea/input controls, `aria-pressed` for selected settings, a semantic table for frequencies, and `<dialog open>` for help/update overlays. Use these exact examples:

```js
export const EXAMPLES = {
  reading: "주인공은 용기를 내어 친구에게 먼저 다가갔습니다. 용기와 우정이 가장 기억에 남았습니다.",
  reflection: "오늘 수업에서 질문하고 협력하는 방법을 배웠습니다. 친구의 생각을 듣는 것이 중요했습니다.",
  environment: "환경을 지키기 위해 재활용하고 물과 전기를 절약해야 합니다. 작은 실천이 지구를 바꿉니다.",
};
```

- [ ] **Step 4: Assemble state and privacy behavior**

`WordCloudStudio.tsx` must:

- initialize with `DEFAULT_SETTINGS` and hydrate only four preference keys from `cloud-classroom-settings`;
- hold text, exclusions, keywords, result, message, and active dialog only in React state;
- reject a fourth keyword and show `핵심어는 최대 3개까지 입력할 수 있어요.`;
- map analysis errors to the exact Korean messages from the design spec;
- regenerate immediately when settings change after a result exists;
- render the order preview, quick settings, text workspace, and frequency table;
- announce generation status through `aria-live="polite"`.

- [ ] **Step 5: Replace starter metadata and page**

`app/layout.tsx` must use `<html lang="ko">`, title `클라우드 수업실 | 교사용 워드 클라우드`, and description `학생들의 생각을 광고 없이, 서버 저장 없이 워드 클라우드로 만드세요.` Remove the `codex-preview` metadata marker and all starter imports. `app/page.tsx` renders `<WordCloudStudio />` and exports matching page metadata.

- [ ] **Step 6: Implement responsive styling**

Use CSS custom properties for the blue visual direction (`#2357c6`, `#f4f8ff`, `#14294d`) and warm accent (`#f06d55`). At 900px and above, keep the preview large with controls surrounding it; below 900px use the order `preview → settings → input → frequency`. Include `:focus-visible`, `prefers-reduced-motion`, 44px minimum touch targets, and no horizontal overflow.

- [ ] **Step 7: Run full tests and verify GREEN**

Run: `npm test`

Expected: all unit and rendered HTML tests pass and build exits 0.

- [ ] **Step 8: Commit the complete classroom UI**

```bash
git add app tests package.json package-lock.json
git commit -m "feat: build teacher word cloud studio"
```

---

### Task 6: Final validation and Sites publication

**Files:**
- Modify only when validation reveals a concrete defect

**Interfaces:**
- Consumes: finished site and `.openai/hosting.json`
- Produces: verified Sites deployment URL

- [ ] **Step 1: Verify file sizes and starter removal**

Run: `find app -type f \( -name '*.tsx' -o -name '*.mjs' -o -name '*.css' \) -print0 | xargs -0 wc -l`

Expected: every product code file is under 500 lines, and no `_sites-preview` files remain.

- [ ] **Step 2: Run fresh tests**

Run: `npm test`

Expected: 0 failures.

- [ ] **Step 3: Run a fresh deployment build**

Run: `npm run build`

Expected: exit code 0 and Cloudflare Worker-compatible output under `dist/`.

- [ ] **Step 4: Inspect the final diff and requirements**

Run: `git status --short && git diff --check && git log --oneline -6`

Expected: no whitespace errors; all spec requirements map to implemented files and tests.

- [ ] **Step 5: Publish with Sites hosting**

Read and follow `sites-hosting/SKILL.md`, deploy the validated build, and capture the returned public Sites URL.

- [ ] **Step 6: Verify the public address**

Open the returned URL once and confirm HTTP 200 plus the title `클라우드 수업실` and visible text `광고 없음`, `서버 저장 없음`, `워드 클라우드 만들기`, and `업데이트 내역`.

- [ ] **Step 7: Commit any validation-only fix**

If Step 1–6 required a code correction, rerun Steps 2–4 and commit only that correction with:

```bash
git add app tests package.json package-lock.json
git commit -m "fix: complete word cloud release validation"
```
