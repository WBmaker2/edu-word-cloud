"use client";

export const EXAMPLES = {
  reading: "주인공은 용기를 내어 친구에게 먼저 다가갔습니다. 용기와 우정이 가장 기억에 남았습니다.",
  reflection: "오늘 수업에서 질문하고 협력하는 방법을 배웠습니다. 친구의 생각을 듣는 것이 중요했습니다.",
  environment: "환경을 지키기 위해 재활용하고 물과 전기를 절약해야 합니다. 작은 실천이 지구를 바꿉니다.",
};

type TextWorkspaceProps = {
  text: string;
  excluded: string;
  keywords: string[];
  error: string | null;
  truncated: boolean;
  onTextChange: (value: string) => void;
  onExcludedChange: (value: string) => void;
  onKeywordsChange: (value: string) => void;
  onGenerate: () => void;
};

export function TextWorkspace({
  text,
  excluded,
  keywords,
  error,
  truncated,
  onTextChange,
  onExcludedChange,
  onKeywordsChange,
  onGenerate,
}: TextWorkspaceProps) {
  return (
    <section className="text-workspace" aria-labelledby="workspace-title">
      <div className="section-heading">
        <div>
          <h2 id="workspace-title">학생 답변 붙여넣기</h2>
          <p>입력한 글은 이 기기에서만 분석되고 새로고침하면 사라집니다.</p>
        </div>
        <span className="character-count" aria-label={`입력 글자 수 ${text.length}자`}>{text.length.toLocaleString()}자</span>
      </div>
      <div className="example-actions" aria-label="예시 불러오기">
        <ExampleButton label="독서 감상 예시" value={EXAMPLES.reading} onSelect={onTextChange} />
        <ExampleButton label="수업 소감 예시" value={EXAMPLES.reflection} onSelect={onTextChange} />
        <ExampleButton label="환경 수업 예시" value={EXAMPLES.environment} onSelect={onTextChange} />
      </div>
      <label htmlFor="student-text">학생 답변 또는 수업 내용</label>
      <textarea
        id="student-text"
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        placeholder="학생들의 답변을 붙여넣어 주세요."
        rows={9}
      />
      <div className="text-workspace__details">
        <label htmlFor="excluded-words">
          빼고 싶은 단어
          <span>쉼표 또는 줄바꿈으로 나눠 적어요.</span>
        </label>
        <textarea
          id="excluded-words"
          value={excluded}
          onChange={(event) => onExcludedChange(event.target.value)}
          placeholder="예: 그리고, 하지만"
          rows={3}
        />
        <label htmlFor="keywords">
          강조할 핵심어
          <span>최대 3개까지, 앞에 쓴 단어가 더 크게 보여요.</span>
        </label>
        <input
          id="keywords"
          value={keywords.join(", ")}
          onChange={(event) => onKeywordsChange(event.target.value)}
          placeholder="예: 환경, 실천, 약속"
        />
      </div>
      {truncated ? <p className="notice">입력이 너무 길어 앞 50,000자만 분석했어요.</p> : null}
      {error ? <p className="error-message" role="alert"><strong>확인이 필요해요.</strong> {error}</p> : null}
      <button type="button" className="primary-action" onClick={onGenerate}>워드 클라우드 만들기</button>
    </section>
  );
}

function ExampleButton({ label, value, onSelect }: { label: string; value: string; onSelect: (value: string) => void }) {
  return <button type="button" onClick={() => onSelect(value)}>{label}</button>;
}
