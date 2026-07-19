"use client";

type InfoDialogProps = { type: "help" | "updates"; onClose: () => void };

export function InfoDialog({ type, onClose }: InfoDialogProps) {
  const isHelp = type === "help";
  return (
    <dialog open aria-labelledby="info-dialog-title" className="info-dialog">
      <div className="info-dialog__content">
        <div className="section-heading">
          <h2 id="info-dialog-title">{isHelp ? "도움말" : "업데이트 내역"}</h2>
          <button type="button" aria-label="안내 닫기" onClick={onClose}>닫기</button>
        </div>
        {isHelp ? (
          <ol>
            <li>학생 답변을 붙여넣고 필요한 단어를 정리해요.</li>
            <li>워드 클라우드를 만든 뒤 모양과 색상을 골라요.</li>
            <li>마음에 들면 PNG 저장 버튼으로 수업 자료를 만들어요.</li>
          </ol>
        ) : <p>2026-07-19 — 교사용 워드 클라우드 사이트 첫 제작</p>}
      </div>
    </dialog>
  );
}
