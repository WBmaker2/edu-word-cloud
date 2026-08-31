# 나뭇잎 마스크 전면 교체 구현 계획

## 승인 범위

- 대상: `leaf` 마스크의 Canvas 실루엣·잎맥·선택기 아이콘
- 참고: 사용자가 첨부한 길고 대각선으로 뻗은 나뭇잎 시안과 현재 구현 피드백
- 전환: 이전 나뭇잎 경로를 부분 수정하지 않고, 실루엣·잎맥·선택 아이콘을 새 기준으로 전면 교체
- 보존: 기존 9개 마스크, 단어 분석·정렬·색상·글꼴·PNG 저장·개인정보 보호 흐름
- 제외: 나비·전구·구름의 추가 재디자인, 새 의존성, 커밋·푸시·배포

## 구현 원칙

1. 기존 경로를 재사용하지 않고, 왼쪽 아래 줄기에서 오른쪽 위 잎끝으로 향하는 새 대각선 실루엣을 정의한다.
2. 중앙 잎맥은 줄기와 잎끝에 실제로 닿게 하되, 짧고 정돈된 좌우 가지 잎맥만 배치해 교차선을 없앤다.
3. Canvas와 마스크 선택 아이콘이 새 기준의 방향·줄기·잎끝 인상을 공유하도록 공통 정규화 기준을 둔다.
4. 승인된 색상 토큰(`#73b393`, `#e8f7ef`)은 유지한다.
5. 단어 배치 판정은 장식선이 아닌 닫힌 실루엣만 사용하고, 기존 학습 흐름과 결정성을 보존한다.

## 변경 순서

1. 이전 `LEAF_*` 경로 정의를 제거하고 새 실루엣·중앙 잎맥·가지 잎맥 기준점을 정의한다.
2. `app/lib/masks.mjs`에서 새 닫힌 실루엣과 내부 선을 연결하고, 줄기 영역이 단어 배치 영역을 분리하지 않도록 확인한다.
3. `app/components/QuickSettings.tsx`의 잎 아이콘을 새 기준 경로에서 생성한다.
4. `InfoDialog` 업데이트 내역에 나뭇잎 마스크 전면 교체 내용을 추가한다.
5. 경로·배치·색상·정적 빌드 테스트를 새 기준점으로 갱신하고 실행한다.
6. 실제 브라우저에서 1280px·375px 화면과 20·40·100단어 상태를 확인하고 캡처한다.

## 수용 기준

- 잎 몸통이 깃털·씨앗·추상 리본처럼 보이지 않고, 새로 그린 잎으로 즉시 인식된다.
- 중앙 잎맥이 줄기에서 잎 끝까지 끊김 없이 이어진다.
- 좌우 가지 잎맥이 잎 몸통 내부에 고르게 보이고 외곽선 밖으로 나가지 않는다.
- Canvas와 선택기의 나뭇잎 방향·줄기·끝점 인상이 일치한다.
- 기존 단어가 닫힌 실루엣 안에 유지되고, 20·40·100단어 및 좁은 화면에서 레이아웃이 깨지지 않는다.
- 녹색 외곽선·연한 녹색 내부 색상과 기존 `aria-pressed`, 포커스, reduced-motion 동작을 유지한다.

## 검증 기록

- route=`design-system`
- observed-statuses=`ui-ux-pro-max=filesystem-only; design-system=runtime-available; impeccable=runtime-available; product-design:audit=runtime-available; design-review=runtime-available; qa=runtime-available; built-in=built-in`
- action=`continue`
- fallback-reason=`ui-ux-pro-max는 현재 턴에 filesystem-only여서 첫 runtime-available fallback인 design-system을 선택`

## 구현·검증 결과

- 이전 나뭇잎 경로를 부분 수정하지 않고 새 대각선 잎몸통·분리된 잎자루·중앙 잎맥·좌우 가지 잎맥으로 교체했다.
- Canvas 배치 영역은 닫힌 잎몸통만 사용하고, 잎자루와 잎맥은 장식선으로 분리했다.
- 선택 아이콘도 같은 공통 기하 기준에서 생성해 Canvas와 방향·끝점 인상을 맞췄다.
- 승인 색상(`#73b393`, `#e8f7ef`)을 유지했다.
- `npm test`: 단위 32개 및 렌더·정적 빌드 테스트 3개 통과.
- `npm run lint`, `git diff --check`: 통과.
- 브라우저: 1280×900에서 나뭇잎·100개 설정 선택 및 캔버스 렌더 확인, 375×812에서 나뭇잎 렌더·가로 오버플로 없음(`scrollWidth=360`, `clientWidth=360`), error console 0.
- 증거: [데스크톱 결과](../../output/playwright/cute-masks-leaf-final-desktop.png), [100개 데스크톱 결과](../../output/playwright/cute-masks-leaf-final-100-desktop.png), [모바일 결과](../../cute-masks-leaf-final-mobile.png).
- 커밋·푸시·배포는 이번 범위에서 수행하지 않았다.
