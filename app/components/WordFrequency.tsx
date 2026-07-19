type Word = { text: string; count: number; weight: number; keywordRank?: number | null };

export function WordFrequency({ words }: { words: Word[] }) {
  return (
    <section className="word-frequency" aria-labelledby="frequency-title">
      <div className="section-heading">
        <div>
          <h2 id="frequency-title">자주 나온 단어</h2>
          <p>생성한 결과의 단어와 횟수를 확인할 수 있어요.</p>
        </div>
      </div>
      <table>
        <thead><tr><th scope="col">순서</th><th scope="col">단어</th><th scope="col">횟수</th><th scope="col">강조</th></tr></thead>
        <tbody>
          {words.length ? words.map((word, index) => (
            <tr key={word.text}>
              <td>{index + 1}</td><td>{word.text}</td><td>{word.count}회</td>
              <td>{word.keywordRank === null || word.keywordRank === undefined ? "기본" : "핵심어"}</td>
            </tr>
          )) : <tr><td colSpan={4}>아직 생성한 단어가 없어요.</td></tr>}
        </tbody>
      </table>
    </section>
  );
}
