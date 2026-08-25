# Four Classroom Masks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 원·말풍선·하트·별·책 마스크에 나비·나뭇잎·전구·구름을 추가하여, 교사가 아홉 가지 실루엣으로 같은 수의 단어를 안정적으로 배치하고 PNG로 저장할 수 있게 한다.

**Architecture:** `app/lib/masks.mjs`가 네 실루엣의 내부 판정, 캔버스 경계 크기, 외곽선 및 필요한 세부선을 단일 기준으로 제공한다. 기존 `cloud-layout.mjs`와 `CloudCanvas.tsx`는 이 공통 인터페이스를 그대로 사용하며, `cloud-options.mjs`와 `QuickSettings.tsx`에는 선택 항목과 식별 가능한 SVG 아이콘만 추가한다.

**Tech Stack:** React 19, TypeScript, Next/vinext, Canvas 2D, Node.js test runner

**Spec:** 사용자 승인 대화(2026-08-25)의 범위가 이 bounded change의 기준이며 별도 spec 파일은 없다.

## Global Constraints

- 새 마스크 ID와 표시 순서는 기존 다섯 개 뒤에 `butterfly`, `leaf`, `lightbulb`, `cloud`를 이 순서로 추가한다.
- 표시 이름은 각각 `나비`, `나뭇잎`, `전구`, `구름`이다.
- 네 실루엣은 외부 이미지나 네트워크 요청 없이 수학 함수와 Canvas 경로만으로 만든다.
- 모든 실루엣은 중앙이 연결된 넓은 내부 영역을 제공하며, 1200×500 캔버스에서 20개와 100개 단어를 생략하지 않는다.
- 내부 판정은 외곽선보다 같거나 보수적이어야 하며, 배치된 글자의 사각형 샘플이 외곽으로 튀어나오지 않아야 한다.
- 마스크 버튼은 320px 이상 화면에서 잘리거나 가로 스크롤을 만들지 않고 줄바꿈될 수 있어야 한다.
- 기존 기본 마스크 `bubble`, 팔레트·글꼴·단어 수, 로컬 저장 범위, PNG 저장 동작은 변경하지 않는다.
- `InfoDialog.tsx` 업데이트 내역 첫 항목에 `2026-08-25 — 나비·나뭇잎·전구·구름 마스크와 선택 아이콘을 추가`를 기록한다.
- 변경하는 모든 코드 파일은 500줄 미만을 유지한다.
- 테스트는 실제 마스크 판정·배치·서버 렌더링 결과를 검증하며 테스트 전용 production API나 외부 mock을 추가하지 않는다.

## Visual Redesign Addendum — 2026-08-25 User Review

첫 구현은 기능·배치 안정성은 충족했지만, 실제 모바일 화면 검토에서 새 네 마스크가 딱딱하고 장식성이 부족하다는 사용자 피드백을 받았다. 아래 미술 방향을 같은 기하·Canvas·SVG 구조 안에서 다시 구현한다.

- 공통 스타일은 **초등학생용 동화책 스티커**처럼 통통하고 둥근 실루엣, 큰 덩어리, 부드러운 곡선으로 통일한다.
- 나비는 위쪽 큰 하트형 날개와 아래쪽 작은 물방울형 날개, 둥근 몸통과 짧은 더듬이로 구성한다. 날개 사이의 움푹한 부분은 얕게 하여 단어 배치 면적을 확보한다.
- 나뭇잎은 수평 렌즈가 아니라 오른쪽 위로 살짝 기울어진 통통한 잎과 짧은 줄기로 만든다. 잎맥은 굵지 않은 곡선 한 줄과 짧은 가지선으로 표현한다.
- 전구는 큰 둥근 유리구, 잘록한 목, 모서리가 둥근 소켓으로 만든다. 소켓선과 작은 하트형 필라멘트로 친근함을 더하되 단어 가독성을 방해하지 않는다.
- 구름은 크기가 다른 네 개의 몽글한 봉우리와 살짝 볼록한 밑면으로 만든다. 뾰족한 꼭짓점과 지나치게 평평한 사각형 인상을 피한다.
- 선택 아이콘은 `36×30` 안에서 실제 마스크와 같은 비율을 쓰고, 흰색/배경색 세부선을 제한적으로 넣어 작은 크기에서도 대상을 구별할 수 있게 한다.
- 실제 Canvas 외곽선과 내부 판정은 계속 보수적으로 일치해야 하며, 네 마스크 모두 100개 단어 배치 계약을 유지한다.
- 모바일 390px에서 아홉 버튼은 잘림 없이 줄바꿈되고, 네 새 아이콘은 최소 32px의 시각 폭을 유지한다.

---

### Task 1: 네 마스크의 기하와 단어 배치 계약

**Files:**
- Modify: `tests/masks-layout.test.mjs`
- Modify: `app/lib/masks.mjs`

**Interfaces:**
- Consumes: 기존 `getMaskBounds(maskId, width, height)`, `isInsideMask(maskId, x, y, width, height)`, `traceMaskPath(context, maskId)`, `traceMaskDetail(context, maskId)` 인터페이스
- Produces: `MASK_IDS = ["circle", "bubble", "heart", "star", "book", "butterfly", "leaf", "lightbulb", "cloud"]`, 네 ID에 대한 내부 판정·경계·Canvas 경로, 상세선 존재 여부를 반환하는 `traceMaskDetail(context, maskId): boolean`

- [ ] **Step 1: 새 마스크 계약을 나타내는 실패 테스트 작성**

  `tests/masks-layout.test.mjs`의 첫 테스트 기대값을 아홉 ID로 바꾸고, 다음처럼 각 실루엣의 대표 내부점과 빈 공간을 실제 1200×500 좌표계에서 검증한다. 이 테스트가 잡아야 할 회귀는 ID 누락, 실루엣이 모두 같은 기본 도형으로 처리되는 문제, 중심 또는 대표 날개·잎·전구 몸체·구름 봉우리가 비는 문제다.

  ```js
  test("new classroom masks expose recognizable connected interiors", () => {
    const width = 1200;
    const height = 500;
    const insidePoints = {
      butterfly: [[0, 0], [-0.24, -0.18], [0.24, -0.18], [-0.2, 0.22], [0.2, 0.22]],
      leaf: [[0, 0], [-0.45, 0], [0.45, 0]],
      lightbulb: [[0, -0.28], [0, 0], [0, 0.58]],
      cloud: [[0, -0.32], [-0.42, 0], [0.42, 0], [0, 0.3]],
    };

    for (const [maskId, points] of Object.entries(insidePoints)) {
      for (const [x, y] of points) {
        assert.equal(isInsideMask(maskId, x, y, width, height), true, `${maskId}: ${x},${y}`);
      }
      assert.equal(isInsideMask(maskId, 0.9, 0.9, width, height), false, maskId);
    }
  });
  ```

- [ ] **Step 2: RED 확인**

  Run: `node --test tests/masks-layout.test.mjs`

  Expected: `MASK_IDS`가 기존 다섯 ID만 포함하고 새 ID의 내부 판정이 `false`라서 FAIL한다.

- [ ] **Step 3: 최소 마스크 기하 구현**

  `app/lib/masks.mjs`에 네 ID를 추가한다. 경계 비율은 다음을 기준으로 하되, 내부 판정과 경로가 일치하도록 미세 조정할 수 있다.

  ```js
  if (maskId === "butterfly") return { halfWidth: width * 0.31, halfHeight: height * 0.42 };
  if (maskId === "leaf") return { halfWidth: width * 0.31, halfHeight: height * 0.34 };
  if (maskId === "lightbulb") return { halfWidth: shortSide * 0.34, halfHeight: shortSide * 0.44 };
  if (maskId === "cloud") return { halfWidth: width * 0.34, halfHeight: height * 0.34 };
  ```

  내부 판정은 다음 형태를 사용한다.

  - `butterfly`: 좌우 위·아래 날개를 이루는 겹친 타원 네 개와 중앙 몸통의 합집합. 모든 영역은 중앙 몸통과 겹치게 한다.
  - `leaf`: `Math.abs(localY) <= 0.68 * (1 - Math.abs(localX) ** 1.65)`인 좌우로 뾰족한 렌즈형 잎.
  - `lightbulb`: 위쪽 넓은 타원형 전구와 아래쪽으로 좁아지는 목·소켓 영역의 합집합.
  - `cloud`: 가운데 큰 봉우리, 좌우 작은 봉우리, 둥근 밑면이 서로 겹치는 합집합.

  `traceMaskPath`에는 각 판정의 바깥쪽을 따르는 닫힌 베지어 경로를 명시적으로 추가한다. 알 수 없는 ID가 별 경로로 떨어지는 기존 fallback은 유지하되, 네 새 ID는 모두 fallback 전에 분기한다. `traceMaskDetail`은 책의 제본선 외에 나뭇잎의 중앙 잎맥과 전구의 소켓선만 그리며, 이 선들은 내부 판정에 영향을 주지 않는다. 상세선을 그린 경우 `true`, 상세선이 없는 마스크는 경로 명령 없이 `false`를 반환한다.

- [ ] **Step 4: GREEN 및 전체 마스크 배치 확인**

  Run: `node --test tests/masks-layout.test.mjs`

  Expected: 아홉 마스크의 중심·대표점·경계 검증과 기존 20개·100개 단어 배치 테스트가 모두 PASS한다.

- [ ] **Step 5: 기하 코드 정리와 회귀 재확인**

  네 실루엣의 반복되는 타원 판정은 다음 형태의 작은 순수 헬퍼로만 추출한다. 새 공개 API는 만들지 않는다.

  ```js
  function isInsideEllipse(x, y, centerX, centerY, radiusX, radiusY) {
    return ((x - centerX) / radiusX) ** 2 + ((y - centerY) / radiusY) ** 2 <= 1;
  }
  ```

  Run: `npm run test:unit`

  Expected: 전체 단위 테스트 PASS, warning 및 unhandled error 없음.

- [ ] **Step 6: Task 1 커밋**

  ```bash
  git add app/lib/masks.mjs tests/masks-layout.test.mjs
  git commit -m "feat: add four classroom mask geometries"
  ```

---

### Task 2: 선택 UI, 아이콘, 반응형 배치와 업데이트 기록

**Files:**
- Modify: `tests/cloud-options.test.mjs`
- Modify: `tests/rendered-html.test.mjs`
- Modify: `app/lib/cloud-options.mjs`
- Modify: `app/components/QuickSettings.tsx`
- Modify: `app/components/CloudCanvas.tsx`
- Modify: `app/globals.css`
- Modify: `app/components/InfoDialog.tsx`

**Interfaces:**
- Consumes: Task 1의 네 마스크 ID와 기존 `MASK_OPTIONS`, `MaskIcon`, `traceMaskDetail` 인터페이스
- Produces: 아홉 개 마스크 선택 버튼, 네 전용 SVG 아이콘, 모든 상세선 렌더링, 좁은 폭 줄바꿈, 2026-08-25 업데이트 기록

- [ ] **Step 1: 옵션과 렌더링 결과의 실패 테스트 작성**

  `tests/cloud-options.test.mjs`에서 옵션 ID와 표시 이름을 함께 검증한다. 이 테스트가 잡아야 할 회귀는 옵션 누락·순서 변경·ID와 한국어 이름의 잘못된 연결이다.

  ```js
  assert.deepEqual(
    MASK_OPTIONS.map(({ id, label }) => [id, label]),
    [
      ["circle", "원"], ["bubble", "말풍선"], ["heart", "하트"],
      ["star", "별"], ["book", "책"], ["butterfly", "나비"],
      ["leaf", "나뭇잎"], ["lightbulb", "전구"], ["cloud", "구름"],
    ],
  );
  ```

  `tests/rendered-html.test.mjs`의 실제 서버 렌더링 HTML 테스트에는 `마스크: 나비`, `마스크: 나뭇잎`, `마스크: 전구`, `마스크: 구름` 접근성 이름과 새 업데이트 문구를 추가한다. 소스 문자열 존재만 확인하는 새 테스트는 만들지 않는다.

- [ ] **Step 2: RED 확인**

  Run: `node --test tests/cloud-options.test.mjs`

  Expected: 기존 다섯 옵션만 있어 FAIL한다.

- [ ] **Step 3: 옵션과 식별 가능한 전용 아이콘 구현**

  `app/lib/cloud-options.mjs`에 다음 항목을 기존 책 뒤에 추가한다.

  ```js
  { id: "butterfly", label: "나비" },
  { id: "leaf", label: "나뭇잎" },
  { id: "lightbulb", label: "전구" },
  { id: "cloud", label: "구름" },
  ```

  `QuickSettings.tsx`의 `MaskIcon`은 네 ID 각각에 `viewBox="0 0 32 28"` 기반의 단색 SVG를 반환한다. 나비는 네 날개와 몸통, 나뭇잎은 뾰족한 잎과 잎맥, 전구는 둥근 전구와 소켓, 구름은 세 봉우리와 평평한 밑면이 32×28 안에서 서로 구분되어야 한다. 모든 SVG는 `aria-hidden="true"`, `fill="currentColor"`를 유지하며 시각 정보는 버튼의 기존 `aria-label`과 중복 낭독되지 않는다.

- [ ] **Step 4: 세부선 렌더링과 반응형 배치 구현**

  `CloudCanvas.tsx`의 `drawMaskOutline`은 책만 조건부로 처리하지 말고 모든 마스크에 Task 1에서 boolean 반환 계약으로 바꾼 `traceMaskDetail`을 호출하며, `true`일 때만 `stroke()`한다.

  ```ts
  context.beginPath();
  if (traceMaskDetail(context, maskId)) context.stroke();
  ```

  `app/globals.css`에는 다음 규칙을 추가해 여섯 개 이상인 마스크 버튼이 가로로 잘리지 않게 한다.

  ```css
  .setting-options--mask { flex-wrap: wrap; }
  .setting-options--mask .setting-option { flex: 0 0 auto; }
  ```

  기존 `@media (max-width: 680px)` 동작과 `prefers-reduced-motion` 규칙은 유지한다.

- [ ] **Step 5: 업데이트 내역 기록**

  `InfoDialog.tsx`의 업데이트 목록 첫 항목에 정확히 다음 문장을 추가한다.

  ```tsx
  <p>2026-08-25 — 나비·나뭇잎·전구·구름 마스크와 선택 아이콘을 추가</p>
  ```

- [ ] **Step 6: GREEN 확인**

  Run: `npm run test:unit`

  Expected: 옵션·마스크 기하·배치·Canvas 계약 테스트가 모두 PASS한다.

  Run: `npm test`

  Expected: 빌드 후 실제 서버 렌더링 HTML에 네 마스크 접근성 이름과 업데이트 문구가 포함되고 전체 테스트가 PASS한다.

- [ ] **Step 7: 정적 빌드와 코드 품질 확인**

  Run: `npm run lint`

  Expected: ESLint error 0.

  Run: `npm run build:static`

  Expected: 정적 사이트 생성 성공, exit code 0.

  Run: `git diff --check`

  Expected: whitespace error 없음.

- [ ] **Step 8: 실제 화면 확인**

  로컬 앱을 열어 데스크톱과 390px 폭에서 다음을 확인한다.

  - 네 버튼의 아이콘과 한국어 이름이 서로 구분된다.
  - 마스크 버튼 행이 잘리지 않고 필요한 경우 줄바꿈된다.
  - 각 마스크를 선택하면 외곽선과 단어 배치가 즉시 바뀐다.
  - 나비 날개, 나뭇잎 잎맥, 전구 몸체·소켓, 구름 봉우리가 알아볼 수 있다.
  - 100개 설정에서도 결과 요약이 100개를 표시하고 단어가 외곽선 밖으로 보이지 않는다.
  - 업데이트 내역에서 2026-08-25 기록이 첫 항목으로 보인다.

- [ ] **Step 9: Task 2 커밋**

  ```bash
  git add app/lib/cloud-options.mjs app/components/QuickSettings.tsx app/components/CloudCanvas.tsx app/globals.css app/components/InfoDialog.tsx tests/cloud-options.test.mjs tests/rendered-html.test.mjs
  git commit -m "feat: expose four new classroom masks"
  ```

---

### Task 3: 사용자 피드백 기반 플레이풀 마스크 재디자인

**Files:**
- Modify: `tests/masks-layout.test.mjs`
- Modify: `tests/rendered-html.test.mjs`
- Modify: `app/lib/masks.mjs`
- Modify: `app/components/QuickSettings.tsx`
- Modify: `app/globals.css`
- Modify: `app/components/InfoDialog.tsx`

- [ ] **Step 1: 새 실루엣의 시각적 특징을 고정하는 실패 테스트 작성**

  기존 중심·100단어 계약에 더해 나비의 상·하 날개, 기울어진 잎의 축, 전구의 넓은 유리구와 좁은 소켓, 구름의 좌우 봉우리를 대표하는 내부/외부점을 검증한다. 서버 렌더링 테스트는 네 SVG가 `36×30` 크기와 새 업데이트 내역 문구를 갖는지 확인한다.

- [ ] **Step 2: RED 확인**

  Run: `node --test tests/masks-layout.test.mjs tests/rendered-html.test.mjs`

  Expected: 새 대표점 또는 새 아이콘 크기·업데이트 문구 기대값이 기존 디자인과 달라 FAIL한다.

- [ ] **Step 3: Canvas 기하와 SVG 아이콘을 같은 플레이풀 아트 디렉션으로 재구성**

  `masks.mjs`의 내부 판정·외곽 경로·세부선을 함께 수정하고, `QuickSettings.tsx`의 네 SVG는 둥근 선 끝과 제한된 내부 디테일을 사용한다. CSS는 선택 상태와 비선택 상태 모두에서 세부선 대비를 유지한다.

- [ ] **Step 4: GREEN 및 실제 화면 검증**

  Run: `npm test && npm run lint && npm run build:static && git diff --check`

  Expected: 전체 PASS. 이어서 390px 실제 브라우저에서 네 마스크를 각각 선택해 100개 표시, 가로 넘침 없음, 아이콘 식별성, 업데이트 내역 첫 항목, 콘솔 오류 0을 확인한다.

- [ ] **Step 5: Task 3 커밋**

  ```bash
  git add docs/superpowers/plans/2026-08-25-four-classroom-masks.md app/lib/masks.mjs app/components/QuickSettings.tsx app/globals.css app/components/InfoDialog.tsx tests/masks-layout.test.mjs tests/rendered-html.test.mjs
  git commit -m "feat: redesign classroom masks for younger learners"
  ```
