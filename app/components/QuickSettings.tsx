"use client";

import {
  FONT_OPTIONS,
  MASK_OPTIONS,
  PALETTE_OPTIONS,
  WORD_COUNT_OPTIONS,
} from "../lib/cloud-options.mjs";

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

type Choice = { id: string; label: string; glyph?: string };

export function QuickSettings({ settings, onChange }: QuickSettingsProps) {
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
      <SettingGroup
        label="색상"
        choices={PALETTE_OPTIONS}
        selected={settings.paletteId}
        onSelect={(paletteId) => onChange({ ...settings, paletteId })}
        kind="palette"
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
              {kind === "mask" ? <span className="setting-icon" aria-hidden="true">{choice.glyph}</span> : null}
              {kind === "palette" ? <span className="palette-swatch" aria-hidden="true">{active ? "✓" : ""}</span> : null}
              <span className="setting-label">{choice.label}</span>
            </button>
          );
        })}
      </div>
      <p className="setting-description">현재 선택: {selectedLabel}</p>
    </fieldset>
  );
}
