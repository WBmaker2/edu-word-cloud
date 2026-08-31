"use client";

import { useEffect, useMemo, useRef } from "react";
import { layoutWords } from "../lib/cloud-layout.mjs";
import { getMaskBounds, getMaskVisualStyle, traceMaskDetail, traceMaskPath } from "../lib/masks.mjs";
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
    let cancelled = false;

    async function renderCanvas() {
      if (typeof document !== "undefined" && document.fonts?.load) {
        await Promise.allSettled([document.fonts.load(`${font.weight} 64px ${font.family}`)]);
      }
      if (cancelled) return;

      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return;

      context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      context.textAlign = "center";
      context.textBaseline = "middle";
      drawMaskOutline(context, settings.maskId, palette.colors[0]);

      if (!layout) return;

      for (const word of layout.placed) {
        drawWord(context, word, font.family, font.weight, palette.colors);
      }
    }

    void renderCanvas();
    return () => {
      cancelled = true;
    };
  }, [font, layout, palette, settings.maskId, settings.wordCount]);

  const placedCount = layout?.placed.length ?? 0;
  const omittedCount = layout?.omitted.length ?? 0;
  const canDownload = Boolean(result && placedCount);
  const summary = omittedCount
    ? `표시된 단어 ${placedCount}개 · 공간이 부족해 ${omittedCount}개는 숨겼어요.`
    : `표시된 단어 ${placedCount}개 · 요청한 단어를 모두 넣었어요.`;
  const countHint = settings.wordCount >= 60
    ? "많이 표시하면 글자가 작아질 수 있어요. 20~40개가 읽기 좋아요."
    : "수업 화면에서는 20~40개가 읽기 좋아요.";

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
      {!result ? <p className="cloud-canvas__empty">입력 내용을 만들면 여기에 결과가 나타나요.</p> : null}
      <div className="cloud-canvas__footer">
        <div className="cloud-canvas__summary">
          {result ? (
            <>
              <p id="cloud-summary">{summary}</p>
              <p className="cloud-canvas__hint">{countHint}</p>
            </>
          ) : (
            <p id="cloud-empty-message">텍스트를 넣고 ‘워드 클라우드 만들기’를 눌러 보세요.</p>
          )}
        </div>
        <button
          type="button"
          className={canDownload ? "download-action gi-pulse" : "download-action"}
          onClick={handleDownload}
          disabled={!canDownload}
          title={result ? undefined : "단어를 만든 뒤 PNG로 저장할 수 있어요."}
        >
          PNG 저장
        </button>
      </div>
    </section>
  );
}

function drawMaskOutline(context: CanvasRenderingContext2D, maskId: string, color: string) {
  const { halfWidth, halfHeight } = getMaskBounds(maskId, CANVAS_WIDTH, CANVAS_HEIGHT);
  const visualStyle = getMaskVisualStyle(maskId, color);
  context.save();
  context.lineWidth = 5;
  context.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  context.scale(halfWidth, halfHeight);
  context.lineWidth /= Math.max(halfWidth, halfHeight);
  context.beginPath();
  traceMaskPath(context, maskId);
  context.fillStyle = visualStyle.fill;
  context.globalAlpha = 0.78;
  context.fill();
  context.strokeStyle = visualStyle.stroke;
  context.globalAlpha = 0.62;
  context.stroke();
  context.beginPath();
  if (traceMaskDetail(context, maskId)) {
    if (maskId === "leaf") {
      context.lineCap = "round";
      context.lineJoin = "round";
    }
    context.strokeStyle = visualStyle.stroke;
    context.globalAlpha = 0.72;
    context.stroke();
  }
  context.restore();
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
