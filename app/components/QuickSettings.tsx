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

type Choice = { id: string; label: string; family?: string; glyph?: string; colors?: readonly string[] };

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
              style={kind === "font" && choice.family ? { fontFamily: choice.family } : undefined}
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
      <svg className="setting-icon setting-icon--butterfly" viewBox="0 0 36 30" aria-hidden="true" fill="currentColor" width="36" height="30">
        <path d="M17.1 14.1C14.5 8.4 8.3 3.1 4.2 4.8c-2.2.9-.8 7.4 4.4 10.3-4.7-.6-7.2 1.5-6 4 1.5 2.9 8.3 1.6 12.4-2.1l1.8-1.6v4.5c-1.5 1.6-1.2 3.6.7 3.6s2.2-2 .7-3.6v-4.5l1.8 1.6c4.1 3.7 10.9 5 12.4 2.1 1.2-2.5-1.3-4.6-6-4 5.2-2.9 6.6-9.4 4.4-10.3-4.1-1.7-10.3 3.6-12.9 9.3l-.9 1.8-.9-1.8Z" />
        <path className="setting-icon__detail" d="M18 7.2v14.2M13.1 11.2l3.1 2.2M22.9 11.2l-3.1 2.2" />
      </svg>
    );
  }

  if (maskId === "leaf") {
    return (
      <svg className="setting-icon setting-icon--leaf" viewBox="0 0 36 30" aria-hidden="true" fill="currentColor" width="36" height="30">
        <path d="M29.7 3.2C18.1 3.7 8.5 6.4 6 13.9c-2 6.1 2.7 10 8.7 8.7 7.4-1.6 12.3-8.5 15-19.4Z" />
        <path d="M6.8 26.8c5.7-8.1 11.3-13.7 21.2-20.3l1 1.4c-8.8 6.2-14.1 11.3-20.6 20.4Z" />
        <path className="setting-icon__detail" d="M9.2 24.9C15.2 16.7 20.3 11.6 28.3 6.4M14.1 19.4l-3.4-1.2M18 15l-3.1-1.5M22.3 11.2l-2.6-1.6" />
      </svg>
    );
  }

  if (maskId === "lightbulb") {
    return (
      <svg className="setting-icon setting-icon--lightbulb" viewBox="0 0 36 30" aria-hidden="true" fill="currentColor" width="36" height="30">
        <path d="M18 2.2a9.3 9.3 0 0 0-5.4 16.9c.8.6 1.3 1.3 1.5 2.3h7.8c.2-1 .7-1.7 1.5-2.3A9.3 9.3 0 0 0 18 2.2Z" />
        <path d="M13.8 22.1h8.4v2.1h-8.4zm1.4 3.3h5.6v2h-5.6z" />
        <path className="setting-icon__detail" d="M14.5 14.5c1.7-2.1 2.9 2.1 4.1 0 1.2-2.1 2.4 2.1 4.1 0M14.2 22.1h7.6" />
      </svg>
    );
  }

  if (maskId === "cloud") {
    return (
      <svg className="setting-icon setting-icon--cloud" viewBox="0 0 36 30" aria-hidden="true" fill="currentColor" width="36" height="30">
        <path d="M7 24.2h22a6.1 6.1 0 0 0 .8-12A9.1 9.1 0 0 0 12.2 8 7.1 7.1 0 0 0 7 24.2Z" />
        <path className="setting-icon__detail" d="M11.2 20.8h3.2M21.7 20.8h3.2" />
      </svg>
    );
  }

  return <span className="setting-icon" aria-hidden="true">{glyph}</span>;
}
