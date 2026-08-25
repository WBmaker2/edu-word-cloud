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
        <path d="M17 13.7C14.6 8.1 8.5 3.5 4.7 5c-2.1.9-.7 6.7 4.5 9.2-4.7-.3-7.1 2.7-5.3 5.1 1.9 2.6 8.4-.1 12-3.9l1.1-1.3v5.1c-1.3 1.6-.8 3.4 1 3.4s2.3-1.8 1-3.4v-5.1l1.1 1.3c3.6 3.8 10.1 6.5 12 3.9 1.8-2.4-.6-5.4-5.3-5.1 5.2-2.5 6.6-8.3 4.5-9.2C27.5 3.5 21.4 8.1 19 13.7l-1 1.7-1-1.7Z" />
        <path className="setting-icon__detail" d="M18 8v12.8M14 11.5l2.8 2M22 11.5l-2.8 2" />
      </svg>
    );
  }

  if (maskId === "leaf") {
    return (
      <svg className="setting-icon setting-icon--leaf" viewBox="0 0 36 30" aria-hidden="true" fill="currentColor" width="36" height="30">
        <path d="M30.8 3.1C19.1 3.9 9.2 6.8 6.2 13.9c-2.3 5.5.9 9.3 6.3 9 7.9-.4 13.8-8.2 18.3-19.8Z" />
        <path d="M6.3 27.3c5.7-8.4 12.3-14.7 23.4-23.2l1.2 1.6C21.4 13.5 14.7 20.2 8.2 28.2Z" />
        <path className="setting-icon__detail" d="M8.6 25.7C15.2 17.1 21.4 11.4 29.5 5.9M14 19.1l-3.6-1.4M18.3 14.8l-3.2-1.7M22.8 10.8l-2.7-1.7" />
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
        <path d="M5.4 23.9h25.2a5.2 5.2 0 0 0 .3-10.4 7.2 7.2 0 0 0-12.7-2.9 6.8 6.8 0 0 0-11 3.8 4.8 4.8 0 0 0-1.8 9.5Z" />
        <path className="setting-icon__detail" d="M10 20.8h3.3M22.7 20.8H26" />
      </svg>
    );
  }

  return <span className="setting-icon" aria-hidden="true">{glyph}</span>;
}
