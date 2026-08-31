"use client";

import { useState } from "react";

type Word = { text: string; count: number; weight: number; keywordRank?: number | null };

export function WordFrequency({ words }: { words: Word[] }) {
  const [expandedKey, setExpandedKey] = useState("");
  const total = words.reduce((sum, word) => sum + word.count, 0);
  const wordSetKey = words.map(({ text, count }) => `${text}:${count}`).join("\u0001");
  const isExpanded = Boolean(wordSetKey) && expandedKey === wordSetKey;
  const visibleWords = isExpanded ? words : words.slice(0, 10);

  return (
    <section className="word-frequency" aria-labelledby="frequency-title">
      <div className="section-heading">
        <div>
          <h2 id="frequency-title">자주 나온 단어</h2>
          <p>생성한 결과의 단어와 횟수를 확인할 수 있어요.</p>
        </div>
      </div>
      <table id="frequency-table">
        <thead><tr><th scope="col">순위</th><th scope="col">단어</th><th scope="col">빈도</th><th scope="col">비율</th></tr></thead>
        <tbody>
          {visibleWords.length ? visibleWords.map((word, index) => (
            <tr key={word.text}>
              <td>{index + 1}</td><td>{word.text}</td><td>{word.count}</td>
              <td>{total ? `${((word.count / total) * 100).toFixed(1)}%` : "-"}</td>
            </tr>
          )) : <tr><td colSpan={4}>아직 생성한 단어가 없어요.</td></tr>}
        </tbody>
      </table>
      {words.length > 10 ? (
        <button
          type="button"
          className="word-frequency__more"
          aria-expanded={isExpanded}
          aria-controls="frequency-table"
          onClick={() => setExpandedKey(isExpanded ? "" : wordSetKey)}
        >
          {isExpanded ? "상위 10개만 보기" : `전체 단어 보기 (${words.length}개)`} <span aria-hidden="true">⌄</span>
        </button>
      ) : null}
    </section>
  );
}
