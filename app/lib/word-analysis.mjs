export const MAX_TEXT_LENGTH = 50_000;

export const DEFAULT_STOP_WORDS = new Set([
  "그리고",
  "그러나",
  "하지만",
  "또한",
  "우리",
  "저는",
  "나는",
  "있다",
  "하다",
  "하는",
  "했다",
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
]);

/** @param {string} value @returns {string[]} */
export function parseList(value) {
  return [
    ...new Set(
      value
        .split(/[\n,]/)
        .map((word) => word.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

/**
 * @param {{ text: string; excludedWords?: string[]; keywords?: string[]; limit?: number }} options
 */
export function analyzeText({ text, excludedWords = [], keywords = [], limit = 40 }) {
  const normalizedSource = text.slice(0, MAX_TEXT_LENGTH);
  const truncated = text.length > MAX_TEXT_LENGTH;

  if (!normalizedSource.trim()) {
    return { words: [], sourceLength: 0, truncated, error: "empty" };
  }

  const exclusions = new Set([
    ...DEFAULT_STOP_WORDS,
    ...excludedWords.map((word) => word.toLowerCase()),
  ]);
  const tokens = (normalizedSource.toLowerCase().match(/[가-힣a-z0-9]+/g) ?? []).filter(
    (word) => word.length > 1 && !/^\d+$/.test(word) && !exclusions.has(word),
  );

  if (tokens.length === 0) {
    return {
      words: [],
      sourceLength: normalizedSource.length,
      truncated,
      error: "insufficient",
    };
  }

  const counts = new Map();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  const keywordRanks = new Map(
    keywords.slice(0, 3).map((word, index) => [word.toLowerCase(), index]),
  );
  const words = [...counts]
    .map(([word, count]) => {
      const rank = keywordRanks.get(word);
      return {
        text: word,
        count,
        weight: rank === undefined ? count : Math.max(count, 8 - rank * 2),
        keywordRank: rank ?? null,
      };
    })
    .sort(
      (a, b) =>
        b.weight - a.weight ||
        b.count - a.count ||
        a.text.localeCompare(b.text, "ko"),
    );

  return {
    words: words.slice(0, limit),
    sourceLength: normalizedSource.length,
    truncated,
    error: null,
  };
}
