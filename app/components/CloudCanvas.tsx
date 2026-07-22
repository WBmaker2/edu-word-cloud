"use client";

import { useEffect, useMemo, useRef } from "react";
import { layoutWords } from "../lib/cloud-layout.mjs";
import { getMaskBounds, traceMaskDetail, traceMaskPath } from "../lib/masks.mjs";
import {
  FONT_OPTIONS,
  PALETTE_OPTIONS,
} from "../lib/cloud-options.mjs";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 500;

type CloudSettings = {
  maskId: string;
  paletteId: string;
  fontId: string;
  wordCount: number;
};

type CloudWord = {
  text: string;
  count: number;
  weight: number;
};

type CloudResult = {
  words: CloudWord[];
};

type CloudCanvasProps = {
  result: CloudResult | null;
  settings: CloudSettings;
  onDownloadError: () => void;
};

type PlacedWord = ReturnType<typeof layoutWords>["placed"][number];

const EXAMPLE_WORDS = [
  { text: "우리", x: 600, y: 315, size: 92, colorIndex: 0 },
  { text: "배움", x: 750, y: 242, size: 39, colorIndex: 1 },
  { text: "용기", x: 445, y: 250, size: 34, colorIndex: 2 },
  { text: "친구", x: 900, y: 340, size: 36, colorIndex: 3 },
  { text: "수업", x: 405, y: 435, size: 68, colorIndex: 1 },
  { text: "생각", x: 770, y: 425, size: 64, colorIndex: 2 },
  { text: "질문", x: 530, y: 505, size: 34, colorIndex: 4 },
  { text: "협력", x: 685, y: 535, size: 38, colorIndex: 1 },
  { text: "함께", x: 570, y: 555, size: 54, colorIndex: 3 },
  { text: "성장", x: 845, y: 565, size: 48, colorIndex: 4 },
  { text: "존중", x: 380, y: 580, size: 35, colorIndex: 0 },
  { text: "실천", x: 930, y: 470, size: 31, colorIndex: 2 },
] as const;

export function CloudCanvas({ result, settings, onDownloadError }: CloudCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const palette = useMemo(
    () => PALETTE_OPTIONS.find(({ id }) => id === settings.paletteId) ?? PALETTE_OPTIONS[0],
    [settings.paletteId],
  );
  const font = useMemo(
    () => FONT_OPTIONS.find(({ id }) => id === settings.fontId) ?? FONT_OPTIONS[0],
    [settings.fontId],
  );
  const layout = useMemo(() => {
    if (!result) return null;

    const displayedWords = result.words.slice(0, settings.wordCount);
    return layoutWords({
      words: displayedWords,
      maskId: settings.maskId,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      seed: displayedWords.map(({ text, count }) => `${text}:${count}`).join("|"),
    });
  }, [result, settings.maskId, settings.wordCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    context.textAlign = "center";
    context.textBaseline = "middle";
    drawMaskOutline(context, settings.maskId, palette.colors[0]);

    if (!layout) {
      drawExampleCloud(context, font.family, font.weight, palette.colors);
      return;
    }

    for (const word of layout.placed) {
      drawWord(context, word, font.family, font.weight, palette.colors);
    }
  }, [font, layout, palette, settings.maskId, settings.wordCount]);

  function handleDownload() {
    const canvas = canvasRef.current;
    const browserDocument = typeof document === "undefined" ? null : document;
    const body = browserDocument?.body;
    const urlApi = typeof URL === "undefined" ? null : URL;
    if (
      !canvas ||
      typeof canvas.toBlob !== "function" ||
      !browserDocument ||
      !body ||
      typeof body.append !== "function" ||
      !urlApi ||
      typeof urlApi.createObjectURL !== "function" ||
      typeof urlApi.revokeObjectURL !== "function"
    ) {
      onDownloadError();
      return;
    }

    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          onDownloadError();
          return;
        }

        let url: string | null = null;
        let link: HTMLAnchorElement | null = null;
        let failed = false;
        try {
          url = urlApi.createObjectURL(blob);
          link = browserDocument.createElement("a");
          if (typeof link.click !== "function") {
            failed = true;
          } else {
            link.href = url;
            link.download = `클라우드-수업실-${formatDate(new Date())}.png`;
            body.append(link);
            link.click();
          }
        } catch {
          failed = true;
        } finally {
          try {
            link?.remove();
            if (url) urlApi.revokeObjectURL(url);
          } catch {
            failed = true;
          }
        }
        if (failed) onDownloadError();
      }, "image/png");
    } catch {
      onDownloadError();
    }
  }

  return (
    <section className="cloud-canvas" aria-label="워드 클라우드 결과">
      <canvas
        ref={canvasRef}
        width={1200}
        height={500}
        aria-label="워드 클라우드 미리보기"
        aria-describedby={result ? "cloud-summary" : "cloud-empty-message"}
        style={{ display: "block", width: "100%", height: "auto", aspectRatio: "12 / 5" }}
      />
      <div className="cloud-canvas__footer">
        {result ? (
          <p id="cloud-summary">표시된 단어 {layout?.placed.length ?? 0}개 · 공간 부족으로 생략 {layout?.omitted.length ?? 0}개</p>
        ) : (
          <p id="cloud-empty-message">텍스트를 붙여넣으면 여기에 결과가 나타나요.</p>
        )}
        <button
          type="button"
          onClick={handleDownload}
          disabled={!result || !layout?.placed.length}
          title={result ? undefined : "단어를 만든 뒤 PNG로 저장할 수 있어요."}
        >
          PNG 저장
        </button>
      </div>
      {!result ? <p className="download-note">단어를 만든 뒤 PNG로 저장할 수 있어요.</p> : null}
    </section>
  );
}

function drawMaskOutline(context: CanvasRenderingContext2D, maskId: string, color: string) {
  const { halfWidth, halfHeight } = getMaskBounds(maskId, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.save();
  context.strokeStyle = color;
  context.globalAlpha = 0.36;
  context.lineWidth = 5;
  context.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  context.scale(halfWidth, halfHeight);
  context.lineWidth /= Math.max(halfWidth, halfHeight);
  context.beginPath();
  traceMaskPath(context, maskId);
  context.stroke();
  if (maskId === "book") {
    context.beginPath();
    traceMaskDetail(context, maskId);
    context.stroke();
  }
  context.restore();
}

function drawExampleCloud(
  context: CanvasRenderingContext2D,
  family: string,
  weight: number,
  colors: readonly string[],
) {
  for (const word of EXAMPLE_WORDS) {
    context.fillStyle = colors[word.colorIndex % colors.length];
    context.font = `${weight} ${word.size}px ${family}`;
    context.fillText(word.text, word.x, word.y);
  }
}

function drawWord(
  context: CanvasRenderingContext2D,
  word: PlacedWord,
  family: string,
  weight: number,
  colors: readonly string[],
) {
  context.save();
  context.translate(word.x, word.y);
  context.rotate((word.rotation * Math.PI) / 180);
  context.fillStyle = colors[word.colorIndex % colors.length];
  context.font = `${weight} ${word.fontSize}px ${family}`;
  context.fillText(word.text, 0, 0);
  context.restore();
}

function formatDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
