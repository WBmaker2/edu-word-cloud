"use client";

export const EXAMPLES = {
  lower: "협력 협력 협력 협력은 서로 돕고 함께 목표를 이루는 것입니다.\n배움 배움 배움은 새로운 것을 알고 이해하는 과정입니다.\n생각 생각 생각을 서로 나누면 더 좋은 수업이 됩니다.\n성장 성장은 어제의 나보다 나아지는 것입니다.\n친구 친구와 소통 소통하면 오해가 줄어듭니다.",
  upper: "질문과 경청은 친구의 생각을 깊이 이해하게 합니다. 도전하는 마음으로 실패를 배움으로 바꿀 수 있습니다.",
  middle: "성장은 어제의 나보다 나아지는 것입니다. 책임감 있게 역할을 맡고 서로 존중하는 태도가 필요합니다.",
  high: "문제를 해결할 때는 다양한 아이디어를 나누고 근거를 들어 의견을 표현해야 합니다.",
  activity: "우리 모둠은 환경을 지키기 위한 실천 계획을 세우고, 작은 행동부터 함께 시작하기로 했습니다.",
};

export const DEFAULT_SAMPLE_TEXT = EXAMPLES.lower;

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
      <div className="section-heading text-workspace__heading">
        <div>
          <h2 id="workspace-title">학생 답변 붙여넣기</h2>
          <p>입력한 글은 이 기기에서만 분석되고 새로고침하면 사라집니다.</p>
        </div>
        <span className="character-count" aria-label={`입력 글자 수 ${text.length}자`}>예시 문장 사용</span>
      </div>
      <label className="input-instruction" htmlFor="student-text">학생들의 답변을 한 줄에 하나씩 붙여넣기 해주세요. (엔터로 구분)</label>
      <textarea
        id="student-text"
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        placeholder="학생들의 답변을 붙여넣어 주세요."
        rows={6}
      />
      <details className="text-workspace__details">
        <summary>단어 더 다듬기</summary>
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
      </details>
      {truncated ? <p className="notice">입력이 너무 길어 앞 50,000자만 분석했어요.</p> : null}
      {error ? <p className="error-message" role="alert"><strong>확인이 필요해요.</strong> {error}</p> : null}
      <div className="workspace-footer">
        <div className="example-actions" aria-label="예시 불러오기">
          <span>예시 불러오기:</span>
          <ExampleButton label="초등 저학년" value={EXAMPLES.lower} onSelect={onTextChange} />
          <ExampleButton label="초등 고학년" value={EXAMPLES.upper} onSelect={onTextChange} />
          <ExampleButton label="중학생" value={EXAMPLES.middle} onSelect={onTextChange} />
          <ExampleButton label="고등학생" value={EXAMPLES.high} onSelect={onTextChange} />
          <ExampleButton label="교과 활동" value={EXAMPLES.activity} onSelect={onTextChange} />
        </div>
        <button type="button" className="primary-action" onClick={onGenerate}>워드 클라우드 만들기</button>
      </div>
    </section>
  );
}

function ExampleButton({ label, value, onSelect }: { label: string; value: string; onSelect: (value: string) => void }) {
  return <button type="button" onClick={() => onSelect(value)}>{label}</button>;
}
