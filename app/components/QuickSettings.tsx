"use client";

import { useState } from "react";
import {
  FONT_OPTIONS,
  MASK_OPTIONS,
  PALETTE_OPTIONS,
  WORD_COUNT_OPTIONS,
} from "../lib/cloud-options.mjs";
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

type Choice = { id: string; label: string; glyph?: string; colors?: readonly string[] };

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
    <fieldset className="setting-group">
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
              onClick={() => onSelect(choice.id)}
            >
              {kind === "mask" ? <MaskIcon maskId={choice.id} glyph={choice.glyph} /> : null}
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
      <p className="setting-description">현재 선택: {selectedLabel}</p>
    </fieldset>
  );
}

function MaskIcon({ maskId, glyph }: { maskId: string; glyph?: string }) {
  if (maskId === "bubble") {
    return (
      <svg className="setting-icon setting-icon--bubble" viewBox="0 0 32 28" aria-hidden="true" fill="currentColor">
        <path d="M5.5 3.5h21A3.5 3.5 0 0 1 30 7v10a3.5 3.5 0 0 1-3.5 3.5H17l-5.6 4.2.8-4.2H5.5A3.5 3.5 0 0 1 2 17V7a3.5 3.5 0 0 1 3.5-3.5Z" />
      </svg>
    );
  }

  if (maskId === "butterfly") {
    return (
      <svg className="setting-icon setting-icon--butterfly" viewBox="0 0 32 28" aria-hidden="true" fill="currentColor">
        <path d="M15 13.5C12.8 7.5 7.2 2.8 3.4 4.4c-2.1.9-.8 7.6 4.3 10.2-4.5-.7-7.1 1.3-6.1 3.4 1.3 2.8 8 1.7 11.9-1.9L15 15v4.1c-1.4 1.6-1.2 3.6.4 3.6s2.1-2 .6-3.6V15l1.5 1.1c3.9 3.6 10.6 4.7 11.9 1.9 1-2.1-1.6-4.1-6.1-3.4 5.1-2.6 6.4-9.3 4.3-10.2C23.8 2.8 18.2 7.5 16 13.5l-.5 1.4-.5-1.4Z" />
        <path d="M15.1 7.2h1.8v13.4h-1.8z" />
      </svg>
    );
  }

  if (maskId === "leaf") {
    return (
      <svg className="setting-icon setting-icon--leaf" viewBox="0 0 32 28" aria-hidden="true" fill="currentColor">
        <path d="M26.8 3.1C16.5 3.5 7.3 6.4 5.3 13.4 3.7 19.1 8.2 23 14 21.9c7.2-1.4 10.8-8.8 12.8-18.8Z" />
        <path d="M6.2 24.6c5.8-7.1 10.4-11.8 18.1-17.2l.8 1.2c-7.3 5-11.9 9.4-17.7 17Z" />
      </svg>
    );
  }

  if (maskId === "lightbulb") {
    return (
      <svg className="setting-icon setting-icon--lightbulb" viewBox="0 0 32 28" aria-hidden="true" fill="currentColor">
        <path d="M16 2.5a8.3 8.3 0 0 0-4.8 15.1c.8.6 1.3 1.2 1.4 2h6.8c.1-.8.6-1.4 1.4-2A8.3 8.3 0 0 0 16 2.5Z" />
        <path d="M12.2 21.2h7.6v1.9h-7.6zm1.2 3h5.2v1.4h-5.2z" />
      </svg>
    );
  }

  if (maskId === "cloud") {
    return (
      <svg className="setting-icon setting-icon--cloud" viewBox="0 0 32 28" aria-hidden="true" fill="currentColor">
        <path d="M7.2 23.3h17.5a5.5 5.5 0 0 0 .7-10.9A8.8 8.8 0 0 0 8.6 10a6.7 6.7 0 0 0-1.4 13.3Z" />
      </svg>
    );
  }

  return <span className="setting-icon" aria-hidden="true">{glyph}</span>;
}
