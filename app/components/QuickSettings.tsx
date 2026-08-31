"use client";

import { useState } from "react";
import {
  FONT_OPTIONS,
  MASK_OPTIONS,
  PALETTE_OPTIONS,
  WORD_COUNT_OPTIONS,
} from "../lib/cloud-options.mjs";
import { getMaskVisualStyle, LEAF_ICON_PATHS } from "../lib/masks.mjs";
import { canMovePalette, getPaletteNavigationTarget } from "../lib/palette-navigation.mjs";

type Settings = {
  maskId: string;
  paletteId: string;
  fontId: string;
  wordCount: number;
};

type QuickSettingsProps = {
  settings: Settings;
  onChange: (settings: Settings) => void;
};

type Choice = { id: string; label: string; family?: string; colors?: readonly string[] };

type MaskIconDefinition = {
  paths: readonly string[];
  detail?: string;
};

const MASK_ICON_DEFINITIONS: Record<string, MaskIconDefinition> = {
  circle: {
    paths: ["M18 4.5a10.5 10.5 0 1 0 0 21a10.5 10.5 0 1 0 0-21Z"],
  },
  bubble: {
    paths: ["M7 5h22c1.7 0 3 1.3 3 3v8.8c0 1.7-1.3 3-3 3H19l-5.8 4.4.8-4.4H7c-1.7 0-3-1.3-3-3V8c0-1.7 1.3-3 3-3Z"],
    detail: "M11.2 14.5h.1M17.9 14.5h.1M24.6 14.5h.1",
  },
  heart: {
    paths: ["M18 25.6C16.5 24 6.1 17.9 5.2 11.5 4.6 7.4 7.5 4.5 11.2 4.5c2.8 0 5 1.6 6.8 3.8 1.8-2.2 4-3.8 6.8-3.8 3.7 0 6.6 2.9 6 7-.9 6.4-11.3 12.5-12.8 14.1Z"],
  },
  star: {
    paths: ["M18 4.1c.4 0 .8.3 1 .8l2.4 5.5 5.9.5c.9.1 1.2 1.2.5 1.8l-4.5 3.8 1.4 5.8c.2.9-.7 1.5-1.5 1l-5.2-3-5.2 3c-.8.5-1.7-.1-1.5-1l1.4-5.8-4.5-3.8c-.7-.6-.4-1.7.5-1.8l5.9-.5 2.4-5.5c.2-.5.6-.8 1-.8Z"],
  },
  book: {
    paths: ["M4.5 6.2C8.7 4.7 13.4 5.3 18 8.5c4.6-3.2 9.3-3.8 13.5-2.3v17.4c-4.2-1.5-8.9-1-13.5 2.1-4.6-3.1-9.3-3.6-13.5-2.1Z"],
    detail: "M18 8.5v17.2",
  },
  butterfly: {
    paths: ["M18 13.8C16.3 10.3 12.6 5.1 8.4 5.1c-2.6 0-3.5 2.4-2.2 4.8.9 1.6 2.5 2.8 4.3 3.6-3.4-.7-6.2.4-6.3 2.8-.1 2.5 2.4 4.1 5.1 3.5 3-.7 5.7-2.9 8.7-6.3 3 3.4 5.7 5.6 8.7 6.3 2.7.6 5.2-1 5.1-3.5-.1-2.4-2.9-3.5-6.3-2.8 1.8-.8 3.4-2 4.3-3.6 1.3-2.4.4-4.8-2.2-4.8-4.2 0-7.9 5.2-9.6 8.7Z"],
    detail: "M18 13.3v10M16.3 12.8c-.6-1.1-1.1-1.9-1.9-2.4M19.7 12.8c.6-1.1 1.1-1.9 1.9-2.4M16.3 23.3h3.4",
  },
  leaf: {
    paths: [LEAF_ICON_PATHS.outline],
    detail: LEAF_ICON_PATHS.detail,
  },
  lightbulb: {
    paths: [
      "M18 3.7c-5.3 0-9.2 3.5-9.2 8.3 0 3.1 1.5 5.3 3.5 6.9.8.6 1.2 1.4 1.3 2.2h8.8c.1-.8.5-1.6 1.3-2.2 2-1.6 3.5-3.8 3.5-6.9 0-4.8-3.9-8.3-9.2-8.3Z",
      "M13.6 21.8h8.8v2.3h-8.8Z",
      "M14.8 25.2h6.4v1.7h-6.4Z",
    ],
    detail: "M18 2.3V1M10.5 6.5l-.9-.9M25.5 6.5l.9-.9M15.2 14.5c1.2-1.7 2.2 1.7 2.8 0 .6 1.7 1.6 1.7 2.8 0",
  },
  cloud: {
    paths: ["M5.8 22.8C4.1 21.8 4.3 18.4 6.7 17.2c-.2-3.6 2.1-6.3 5.5-6.4 2.1 0 3.9 1.1 5.1 3.1 1.2-2 3.1-3.1 5.3-3.1 2.9 0 5.2 2.1 5.5 4.9 3-.3 4.7 2.8 3.3 5.4 1.7 1.2 1.3 4.3-1.1 5.1-5.7 1.8-18.1 1.8-23.7-.2Z"],
  },
};

export function QuickSettings({ settings, onChange }: QuickSettingsProps) {
  const [hasNavigatedPalette, setHasNavigatedPalette] = useState(false);

  function selectPalette(paletteId: string) {
    setHasNavigatedPalette(true);
    onChange({ ...settings, paletteId });
  }

  function movePalette(direction: -1 | 1) {
    const paletteId = getPaletteNavigationTarget(
      settings.paletteId,
      direction,
      hasNavigatedPalette,
    );
    setHasNavigatedPalette(true);
    onChange({ ...settings, paletteId });
  }

  return (
    <section className="quick-settings" aria-labelledby="settings-title">
      <h2 id="settings-title" className="sr-only">빠른 설정</h2>
      <SettingGroup
        label="마스크"
        choices={MASK_OPTIONS}
        selected={settings.maskId}
        onSelect={(maskId) => onChange({ ...settings, maskId })}
        kind="mask"
      />
      <PaletteSettingGroup
        selected={settings.paletteId}
        onSelect={selectPalette}
        onMove={movePalette}
        canMovePrevious={canMovePalette(settings.paletteId, -1, hasNavigatedPalette)}
        canMoveNext={canMovePalette(settings.paletteId, 1, hasNavigatedPalette)}
      />
      <SettingGroup
        label="글꼴"
        choices={FONT_OPTIONS}
        selected={settings.fontId}
        onSelect={(fontId) => onChange({ ...settings, fontId })}
        kind="font"
      />
      <SettingGroup
        label="단어 수"
        choices={WORD_COUNT_OPTIONS.map((count) => ({ id: String(count), label: `${count}개` }))}
        selected={String(settings.wordCount)}
        onSelect={(wordCount) => onChange({ ...settings, wordCount: Number(wordCount) })}
        kind="count"
      />
    </section>
  );
}

function PaletteSettingGroup({
  selected,
  onSelect,
  onMove,
  canMovePrevious,
  canMoveNext,
}: {
  selected: string;
  onSelect: (id: string) => void;
  onMove: (direction: -1 | 1) => void;
  canMovePrevious: boolean;
  canMoveNext: boolean;
}) {
  const selectedLabel = PALETTE_OPTIONS.find((choice) => choice.id === selected)?.label ?? "아직 선택 안 함";

  return (
    <fieldset className="setting-group setting-group--palette">
      <legend>색상</legend>
      <div className="setting-options setting-options--palette">
        {PALETTE_OPTIONS.map((choice) => {
          const active = choice.id === selected;
          return (
            <button
              type="button"
              key={choice.id}
              className={active ? `setting-option setting-option--${choice.id} is-selected` : `setting-option setting-option--${choice.id}`}
              aria-pressed={active}
              aria-label={`색상: ${choice.label}`}
              onClick={() => onSelect(choice.id)}
            >
              <span
                className="palette-swatch"
                aria-hidden="true"
                style={{ background: `linear-gradient(135deg, ${choice.colors.join(", ")})` }}
              >
                {active ? "✓" : ""}
              </span>
              <span className="setting-label">{choice.label}</span>
            </button>
          );
        })}
      </div>
      <div className="palette-navigation" aria-label="색상 한 칸씩 비교">
        <button type="button" aria-label="이전 색상" title="이전 색상" disabled={!canMovePrevious} onClick={() => onMove(-1)}>
          <ChevronIcon direction="left" />
        </button>
        <button type="button" aria-label="다음 색상" title="다음 색상" disabled={!canMoveNext} onClick={() => onMove(1)}>
          <ChevronIcon direction="right" />
        </button>
      </div>
      <p className="setting-description" aria-live="polite">
        현재: {selectedLabel} · 화살표를 처음 누르면 첫 색상부터 비교해요.
      </p>
    </fieldset>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const path = direction === "left" ? "M14 5 7 12l7 7" : "m10 5 7 7-7 7";
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

function SettingGroup({
  label,
  choices,
  selected,
  onSelect,
  kind,
}: {
  label: string;
  choices: readonly Choice[];
  selected: string;
  onSelect: (id: string) => void;
  kind: "mask" | "palette" | "font" | "count";
}) {
  const selectedLabel = choices.find((choice) => choice.id === selected)?.label ?? "";

  return (
    <fieldset className={`setting-group setting-group--${kind}`}>
      <legend>{label}</legend>
      <div className={`setting-options setting-options--${kind}`}>
        {choices.map((choice) => {
          const active = choice.id === selected;
          return (
            <button
              type="button"
              key={choice.id}
              className={active ? `setting-option setting-option--${choice.id} is-selected` : `setting-option setting-option--${choice.id}`}
              aria-pressed={active}
              aria-label={`${label}: ${choice.label}`}
              style={kind === "font" && choice.family ? { fontFamily: choice.family } : undefined}
              onClick={() => onSelect(choice.id)}
            >
              {kind === "mask" ? <MaskIcon maskId={choice.id} /> : null}
              {kind === "palette" ? (
                <span
                  className="palette-swatch"
                  aria-hidden="true"
                  style={{ background: `linear-gradient(135deg, ${choice.colors?.join(", ") ?? "#0d3f93"})` }}
                >
                  {active ? "✓" : ""}
                </span>
              ) : null}
              <span className="setting-label">{choice.label}</span>
            </button>
          );
        })}
      </div>
      <p className={kind === "count" ? "setting-description setting-description--count" : "setting-description"}>
        {kind === "count"
          ? Number(selected) >= 60
            ? "많이 표시하면 글자가 작아질 수 있어요."
            : "20~40개가 수업 화면에서 읽기 좋아요."
          : `현재 선택: ${selectedLabel}`}
      </p>
    </fieldset>
  );
}

function MaskIcon({ maskId }: { maskId: string }) {
  const definition = MASK_ICON_DEFINITIONS[maskId];
  if (!definition) return null;
  const visualStyle = getMaskVisualStyle(maskId, "currentColor");

  return (
    <svg className={`setting-icon setting-icon--${maskId}`} viewBox="0 0 36 30" aria-hidden="true" fill="currentColor" width="36" height="30" style={{ color: visualStyle.stroke }}>
      {definition.paths.map((path) => <path key={path} d={path} />)}
      {definition.detail ? <path className="setting-icon__detail" d={definition.detail} /> : null}
    </svg>
  );
}
