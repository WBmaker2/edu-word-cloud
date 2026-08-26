"use client";

import { useEffect, useRef } from "react";

type InfoDialogProps = { type: "help" | "updates"; onClose: () => void };

export const UPDATE_HISTORY = [
  "2026-08-26 — 첨부 이미지 기준으로 나비·나뭇잎·전구·구름 마스크의 외곽선과 아이콘을 다시 그리고, 단어 배치 영역을 외곽 경로와 일치시킴",
  "2026-08-25 — 초등학생이 좋아할 만한 무료 한글 글꼴 '동글동글 주아'와 '또박또박 고운돋움' 2종을 추가",
  "2026-08-25 — 나비·나뭇잎·전구·구름 마스크를 초등학생용 둥근 동화책 스티커 스타일로 재디자인",
  "2026-07-23 — 마스크와 관계없이 선택한 모든 단어를 마스크 안에 배치하도록 글자 크기와 간격을 자동 조절",
  "2026-07-23 — 말풍선 마스크 버튼을 실제 말풍선처럼 보이는 아이콘으로 개선",
  "2026-07-23 — 현재 색상 이름과 첫 화살표의 비교 순서를 보여 주고, 중간 화면 폭의 설정 막대 경계를 정돈",
  "2026-07-23 — 색상 팔레트를 6개로 늘리고, 이전·다음 화살표로 한 칸씩 비교할 수 있도록 개선",
  "2026-07-23 — 말풍선·하트 외곽선을 매끈하게 다듬고, 책을 세로 비율이 살아 있는 열린 책 모양으로 개선",
  "2026-07-23 — 선택한 마스크 안에 단어가 배치되도록 모양별 경계를 맞추고, 모든 색상 견본이 보이도록 개선",
  "2026-07-19 — 첨부 시안에 맞춰 가로형 미리보기, 설정 막대, 단어표 디자인을 개선",
  "2026-07-19 — GitHub Pages에서도 스타일과 미리보기 자산이 안정적으로 열리도록 배포 경로를 개선",
  "2026-07-19 — 교사용 워드 클라우드 사이트 첫 제작",
] as const;

export const LATEST_UPDATE = UPDATE_HISTORY[0];

export function InfoDialog({ type, onClose }: InfoDialogProps) {
  const isHelp = type === "help";
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();
    closeButtonRef.current?.focus();
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      if (dialog.open) dialog.close();
    };
  }, [onClose]);

  return (
    <dialog ref={dialogRef} aria-labelledby="info-dialog-title" className="info-dialog">
      <div className="info-dialog__content">
        <div className="section-heading">
          <h2 id="info-dialog-title">{isHelp ? "도움말" : "업데이트 내역"}</h2>
          <button ref={closeButtonRef} type="button" className="info-dialog__close" aria-label="안내 닫기" onClick={onClose}>닫기</button>
        </div>
        {isHelp ? (
          <ol>
            <li>학생 답변을 붙여넣고 필요한 단어를 정리해요.</li>
            <li>워드 클라우드를 만든 뒤 모양과 색상을 골라요.</li>
            <li>마음에 들면 PNG 저장 버튼으로 수업 자료를 만들어요.</li>
          </ol>
        ) : <div>{UPDATE_HISTORY.map((update) => <p key={update}>{update}</p>)}</div>}
      </div>
    </dialog>
  );
}
