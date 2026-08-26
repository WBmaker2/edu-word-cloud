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
        <path d="M18 14.5C15.5 8.5 9.2 2.7 5.1 4.6c-2.3 1.1-.9 7.2 4.1 10.1-4.3-.3-6.8 2.5-5 5.5 1.8 3.1 8.5.7 12.8-3.8l1-1.1 1 1.1c4.3 4.5 11 6.9 12.8 3.8 1.8-3-.7-5.8-5-5.5 5-2.9 6.4-9 4.1-10.1-4.1-1.9-10.4 3.9-12.9 9.9Z" />
        <path className="setting-icon__detail" d="M18 11v13M16.5 11.5 14 8.4M19.5 11.5 22 8.4M15.8 25.5h4.4" />
      </svg>
    );
  }

  if (maskId === "leaf") {
    return (
      <svg className="setting-icon setting-icon--leaf" viewBox="0 0 36 30" aria-hidden="true" fill="currentColor" width="36" height="30">
        <path d="M30.9 2.7C23.3 4 16 5.8 11.1 8.9c-.2-1.4-1.1-2.1-2.1-1.7-1.1.5-1.1 1.8-.4 2.8-1.3-.3-2.3.2-2.4 1.3-.1 1.1.7 1.8 1.8 2-1.1.4-1.6 1.4-1 2.3.5.9 1.6 1 2.6.5-1 .9-1.1 2-.3 2.7.7.7 1.8.5 2.5-.3-.5 1.1-.1 2.1.8 2.4 1 .3 1.7-.4 1.9-1.5.2 1.2 1 1.8 1.9 1.6 1-.2 1.3-1.2.9-2.3 5-2.3 8.9-6.7 13.6-18Z" />
        <path className="setting-icon__detail" d="M7 27.4C13.2 18.2 20.2 10.8 30.2 3.5M12.5 20.4 9 18.8M16.2 16.1 12.7 14.3M20.2 12.1 17 10.2M24.3 8.2 21.6 6.7" />
      </svg>
    );
  }

  if (maskId === "lightbulb") {
    return (
      <svg className="setting-icon setting-icon--lightbulb" viewBox="0 0 36 30" aria-hidden="true" fill="currentColor" width="36" height="30">
        <path d="M18 5a7.7 7.7 0 0 0-4.5 13.9c.9.7 1.5 1.5 1.6 2.5h5.8c.1-1 .7-1.8 1.6-2.5A7.7 7.7 0 0 0 18 5Z" />
        <path d="M14.8 22.2h6.4v1.9h-6.4zm1.1 3h4.2v1.8h-4.2z" />
        <path className="setting-icon__detail" d="M15.1 15c1.2-1.8 2.1 1.7 2.9 0 .8-1.7 1.7 1.8 2.9 0M15.2 22.2h5.6M18 2.2v-1M8.7 6.2 7.5 5M27.3 6.2 28.5 5M5.8 13h-1.5M30.2 13h1.5M8.7 20l-1.2 1.2M27.3 20l1.2 1.2" />
      </svg>
    );
  }

  if (maskId === "cloud") {
    return (
      <svg className="setting-icon setting-icon--cloud" viewBox="0 0 36 30" aria-hidden="true" fill="currentColor" width="36" height="30">
        <path d="M5.2 24.2a4.3 4.3 0 0 1 .4-8.5 6.2 6.2 0 0 1 11-3.3 5.2 5.2 0 0 1 8.7-1.3 4.2 4.2 0 0 1 5.1 4.2 4.4 4.4 0 0 1-.3 8.8Z" />
        <path className="setting-icon__detail" d="M7.8 21.2h4.6M21 21.2h6.2" />
      </svg>
    );
  }

  return <span className="setting-icon" aria-hidden="true">{glyph}</span>;
}
