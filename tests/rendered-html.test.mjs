import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the teacher word cloud classroom", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  for (const phrase of [
    "클라우드 수업실",
    "학생 생각을 한눈에, 수업을 더 풍성하게",
    "광고 없음",
    "서버 저장 없음",
    "다시 만들기",
    "업데이트 내역",
    "마스크: 나비",
    "마스크: 나뭇잎",
    "마스크: 전구",
    "마스크: 구름",
    "글꼴: 동글동글 주아",
    "글꼴: 또박또박 고운돋움",
  ]) {
    assert.match(html, new RegExp(phrase));
  }
  for (const maskId of ["butterfly", "leaf", "lightbulb", "cloud"]) {
    assert.match(
      html,
      new RegExp(`<svg class="setting-icon setting-icon--${maskId}"[^>]*\\bwidth="36"[^>]*\\bheight="30"`),
    );
  }
  assert.match(html, /<button[^>]*title="2026-08-31 — GitHub Pages 하위 경로에서도 앱 자산과 파비콘이 안정적으로 열리도록 정적 배포 경로를 보정/);
  assert.match(html, /setting-icon__detail/);
  assert.doesNotMatch(html, /data-latest-update/);
  for (const starterMarker of [
    "codex-preview",
    "react-loading-skeleton",
    "Your site is taking shape",
  ]) {
    assert.doesNotMatch(html, new RegExp(starterMarker, "i"));
  }
});

test("keeps the approved controls, accessibility signals, and privacy boundary in source", async () => {
  const appRoot = new URL("../app/", import.meta.url);
  const [studio, settings, workspace, frequency, dialog, options, layout, page, styles] =
    await Promise.all([
      readFile(new URL("WordCloudStudio.tsx", appRoot), "utf8"),
      readFile(new URL("components/QuickSettings.tsx", appRoot), "utf8"),
      readFile(new URL("components/TextWorkspace.tsx", appRoot), "utf8"),
      readFile(new URL("components/WordFrequency.tsx", appRoot), "utf8"),
      readFile(new URL("components/InfoDialog.tsx", appRoot), "utf8"),
      readFile(new URL("lib/cloud-options.mjs", appRoot), "utf8"),
      readFile(new URL("layout.tsx", appRoot), "utf8"),
      readFile(new URL("page.tsx", appRoot), "utf8"),
      readFile(new URL("globals.css", appRoot), "utf8"),
    ]);
  const source = [studio, settings, workspace, frequency, dialog, options, layout, page].join("\n");

  for (const label of ["원", "말풍선", "하트", "별", "책"]) {
    assert.match(source, new RegExp(`label: "${label}"`));
  }
  for (const count of [20, 40, 60, 80, 100]) {
    assert.match(options, new RegExp(`\\b${count}\\b`));
  }
  assert.match(settings, /aria-pressed/);
  assert.match(settings, /choice\.family/);
  assert.match(settings, /이전 색상/);
  assert.match(settings, /다음 색상/);
  assert.match(settings, /ChevronIcon/);
  assert.match(settings, /MaskIcon/);
  assert.match(settings, /setting-icon--bubble/);
  assert.match(settings, /화살표를 처음 누르면 첫 색상부터 비교해요/);
  assert.match(settings, /aria-live="polite"/);
  for (const label of ["차분한 보라", "봄빛 파스텔"]) {
    assert.match(options, new RegExp(`label: "${label}"`));
  }
  assert.match(studio, /aria-live="polite"/);
  assert.match(studio, /입력이 바뀌었어요\.<\/strong> 다시 만들기를 눌러 반영하세요\./);
  assert.match(studio, /createInputSignature/);
  assert.match(dialog, /<dialog ref=\{dialogRef\}/);
  for (const example of ["초등 저학년", "초등 고학년", "중학생", "고등학생", "교과 활동"]) {
    assert.match(workspace, new RegExp(example));
  }
  assert.match(dialog, /2026-08-26 — 첨부 이미지 기준으로 나비·나뭇잎·전구·구름 마스크의 외곽선과 아이콘을 다시 그리고, 단어 배치 영역을 외곽 경로와 일치시킴/);
  assert.match(dialog, /2026-08-31 — 입력 변경을 다시 만들기 전까지 보류하고, 단어표 펼침·가독성 안내·PNG 요약을 개선/);
  assert.match(dialog, /2026-08-25 — 초등학생이 좋아할 만한 무료 한글 글꼴 '동글동글 주아'와 '또박또박 고운돋움' 2종을 추가/);
  assert.match(dialog, /2026-07-23 — 선택한 마스크 안에 단어가 배치되도록/);
  assert.match(dialog, /현재 색상 이름과 첫 화살표의 비교 순서를 보여 주고/);
  assert.match(dialog, /말풍선 마스크 버튼을 실제 말풍선처럼 보이는 아이콘으로 개선/);
  assert.match(dialog, /마스크와 관계없이 선택한 모든 단어를 마스크 안에 배치하도록/);
  assert.match(settings, /linear-gradient\(135deg/);
  assert.match(options, /family: "Jua, sans-serif"/);
  assert.match(options, /family: "'Gowun Dodum', sans-serif"/);
  assert.match(styles, /fonts\.googleapis\.com\/css2\?family=Gowun\+Dodum\&family=Jua/);
  assert.match(styles, /\.setting-options--font\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.match(studio, /localStorage\.setItem\("cloud-classroom-settings"/);
  for (const privateValue of ["text", "excluded", "keywords", "result"]) {
    assert.doesNotMatch(
      studio,
      new RegExp(`localStorage\\.setItem\\([^)]*\\b${privateValue}\\b`, "s"),
    );
  }
  assert.match(frequency, /<table/);
  assert.match(frequency, /aria-expanded=\{isExpanded\}/);
  assert.match(frequency, /전체 단어 보기/);
  assert.match(layout, /lang="ko"/);
  assert.match(page, /<WordCloudStudio \/>/);
  await assert.rejects(access(new URL("_sites-preview", appRoot)));

  assert.match(studio, /className="preview-error" role="alert"/);
  assert.match(studio, /PNG 저장에 실패했어요\./);
  assert.match(studio, /저장 버튼을 다시 눌러 주세요\./);
  assert.match(dialog, /dialog\.showModal\(\)/);
  assert.match(dialog, /addEventListener\("cancel", handleCancel\)/);
  assert.match(dialog, /closeButtonRef\.current\?\.focus\(\)/);
  assert.match(studio, /openerRef\.current = opener/);
  assert.match(studio, /requestAnimationFrame\(\(\) => openerRef\.current\?\.focus\(\)\)/);
  assert.match(styles, /\.info-dialog__close\s*\{[^}]*min-height:\s*44px/s);
  assert.match(styles, /\.gi-pulse/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /\.setting-group:nth-of-type\(odd\)/);
  assert.match(studio, /truncated=\{text\.length > MAX_TEXT_LENGTH\}/);
});
