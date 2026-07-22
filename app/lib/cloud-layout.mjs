import { isInsideMask } from "./masks.mjs";

const MAX_ATTEMPTS = 2_000;
const PADDING = 8;
const MIN_FONT_SIZE = 30;
const MAX_FONT_SIZE = 112;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function layoutWords({ words, maskId, width, height, seed }) {
  const random = createRandom(seed);
  const sortedWords = [...words].sort(
    (a, b) => b.weight - a.weight || b.count - a.count || a.text.localeCompare(b.text, "ko"),
  );
  const weights = sortedWords.map((word) => word.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const placed = [];
  const omitted = [];

  for (const [index, word] of sortedWords.entries()) {
    const fontSize = fontSizeFor(word.weight, minWeight, maxWeight);
    const rotation = index > 5 && (index - 6) % 2 === 1 ? 90 : 0;
    const dimensions = wordDimensions(word.text, fontSize, rotation);
    const startAngle = random() * Math.PI * 2;
    const colorIndex = Math.floor(random() * 6);
    const position = findPosition({
      placed,
      maskId,
      width,
      height,
      dimensions,
      startAngle,
    });

    if (!position) {
      omitted.push({ text: word.text, count: word.count, weight: word.weight });
      continue;
    }

    placed.push({
      text: word.text,
      count: word.count,
      weight: word.weight,
      x: position.x,
      y: position.y,
      nx: position.nx,
      ny: position.ny,
      fontSize,
      rotation,
      colorIndex,
      ...dimensions,
    });
  }

  return {
    placed: placed.map(toPublicWord),
    omitted,
  };
}

function toPublicWord({ text, count, weight, x, y, nx, ny, fontSize, rotation, colorIndex }) {
  return { text, count, weight, x, y, nx, ny, fontSize, rotation, colorIndex };
}

function findPosition({ placed, maskId, width, height, dimensions, startAngle }) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const radius = Math.sqrt(attempt / MAX_ATTEMPTS) * 0.94;
    const angle = startAngle + attempt * GOLDEN_ANGLE;
    const nx = radius * Math.cos(angle);
    const ny = radius * Math.sin(angle);
    const x = round(width / 2 + nx * (width / 2));
    const y = round(height / 2 + ny * (height / 2));
    const candidate = { x, y, nx: round(nx), ny: round(ny), ...dimensions };

    if (isInsideRectangle(maskId, candidate, width, height) && !overlaps(placed, candidate)) {
      return candidate;
    }
  }
  return null;
}

function fontSizeFor(weight, minWeight, maxWeight) {
  if (minWeight === maxWeight) return 60;
  return round(MIN_FONT_SIZE + ((weight - minWeight) / (maxWeight - minWeight)) * (MAX_FONT_SIZE - MIN_FONT_SIZE));
}

function wordDimensions(text, fontSize, rotation) {
  const horizontalWidth = Math.max(fontSize, [...text].reduce((total, character) => total + fontSize * characterWidth(character), 0));
  const boxWidth = rotation === 90 ? fontSize : horizontalWidth;
  const boxHeight = rotation === 90 ? horizontalWidth : fontSize;
  return { boxWidth: round(boxWidth), boxHeight: round(boxHeight) };
}

function characterWidth(character) {
  return /[가-힣]/.test(character) ? 1 : 0.62;
}

function isInsideRectangle(maskId, candidate, width, height) {
  const halfWidth = candidate.boxWidth / 2;
  const halfHeight = candidate.boxHeight / 2;
  const samples = [
    [candidate.x - halfWidth, candidate.y - halfHeight],
    [candidate.x + halfWidth, candidate.y - halfHeight],
    [candidate.x - halfWidth, candidate.y + halfHeight],
    [candidate.x + halfWidth, candidate.y + halfHeight],
    [candidate.x, candidate.y],
  ];

  return samples.every(([x, y]) => isInsideMask(
    maskId,
    x / (width / 2) - 1,
    y / (height / 2) - 1,
    width,
    height,
  ));
}

function overlaps(placed, candidate) {
  return placed.some(
    (word) =>
      Math.abs(word.x - candidate.x) < (word.boxWidth + candidate.boxWidth) / 2 + PADDING &&
      Math.abs(word.y - candidate.y) < (word.boxHeight + candidate.boxHeight) / 2 + PADDING,
  );
}

function createRandom(seed) {
  let value = 2_166_136_261;
  for (const character of String(seed)) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16_777_619);
  }
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function round(value) {
  return Math.round(value * 100) / 100;
}
