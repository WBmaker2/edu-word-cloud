export const MASK_OPTIONS = [
  { id: "circle", label: "원", glyph: "●" },
  { id: "bubble", label: "말풍선", glyph: "▰" },
  { id: "heart", label: "하트", glyph: "♥" },
  { id: "star", label: "별", glyph: "★" },
  { id: "book", label: "책", glyph: "▤" },
];

export const PALETTE_OPTIONS = [
  { id: "classroom", label: "교실 초록", colors: ["#245a45", "#367b5d", "#d56c45", "#e2aa42", "#3f5f94"] },
  { id: "clear", label: "맑은 파랑", colors: ["#1f4fbf", "#3478d4", "#2b8f83", "#f08a5d", "#6b5fb5"] },
  { id: "warm", label: "따뜻한 주황", colors: ["#8f3f2c", "#c45f3e", "#e09145", "#6e7c4f", "#59433a"] },
  { id: "rainbow", label: "다채로운 무지개", colors: ["#d64545", "#e28b32", "#2f8a58", "#2873b8", "#7554a8"] },
];

export const FONT_OPTIONS = [
  { id: "clean", label: "깔끔한 고딕", family: "Arial, sans-serif", weight: 700 },
  { id: "strong", label: "힘 있는 고딕", family: "Arial Black, Arial, sans-serif", weight: 800 },
  { id: "serif", label: "부드러운 명조", family: "Georgia, serif", weight: 700 },
];

export const WORD_COUNT_OPTIONS = [20, 40, 60, 80, 100];

export const DEFAULT_SETTINGS = {
  maskId: "bubble",
  paletteId: "clear",
  fontId: "clean",
  wordCount: 40,
};

export function normalizeSettings(value) {
  const settings = value && typeof value === "object" ? value : {};

  return {
    maskId: includesId(MASK_OPTIONS, settings.maskId) ? settings.maskId : DEFAULT_SETTINGS.maskId,
    paletteId: includesId(PALETTE_OPTIONS, settings.paletteId) ? settings.paletteId : DEFAULT_SETTINGS.paletteId,
    fontId: includesId(FONT_OPTIONS, settings.fontId) ? settings.fontId : DEFAULT_SETTINGS.fontId,
    wordCount: WORD_COUNT_OPTIONS.includes(settings.wordCount) ? settings.wordCount : DEFAULT_SETTINGS.wordCount,
  };
}

function includesId(options, value) {
  return options.some((option) => option.id === value);
}
