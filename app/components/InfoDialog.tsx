"use client";

import { useEffect, useRef } from "react";

type InfoDialogProps = { type: "help" | "updates"; onClose: () => void };

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
        ) : <div><p>2026-07-19 — 큰 미리보기 중심의 교사용 작업 화면으로 디자인을 개선</p><p>2026-07-19 — 교사용 워드 클라우드 사이트 첫 제작</p></div>}
      </div>
    </dialog>
  );
}
