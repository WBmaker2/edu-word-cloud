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

type Choice = { id: string; label: string };

export function QuickSettings({ settings, onChange }: QuickSettingsProps) {
  return (
    <section className="quick-settings" aria-labelledby="settings-title">
      <div>
        <h2 id="settings-title">빠른 설정</h2>
        <p>선택한 설정은 바로 미리보기에 반영돼요.</p>
      </div>
      <SettingGroup
        label="모양"
        choices={MASK_OPTIONS}
        selected={settings.maskId}
        onSelect={(maskId) => onChange({ ...settings, maskId })}
      />
      <SettingGroup
        label="색상"
        choices={PALETTE_OPTIONS}
        selected={settings.paletteId}
        onSelect={(paletteId) => onChange({ ...settings, paletteId })}
      />
      <SettingGroup
        label="글꼴"
        choices={FONT_OPTIONS}
        selected={settings.fontId}
        onSelect={(fontId) => onChange({ ...settings, fontId })}
      />
      <SettingGroup
        label="단어 수"
        choices={WORD_COUNT_OPTIONS.map((count) => ({ id: String(count), label: `${count}개` }))}
        selected={String(settings.wordCount)}
        onSelect={(wordCount) => onChange({ ...settings, wordCount: Number(wordCount) })}
      />
    </section>
  );
}

function SettingGroup({
  label,
  choices,
  selected,
  onSelect,
}: {
  label: string;
  choices: readonly Choice[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const selectedLabel = choices.find((choice) => choice.id === selected)?.label ?? "";

  return (
    <fieldset className="setting-group">
      <legend>{label}</legend>
      <div className="setting-options">
        {choices.map((choice) => {
          const active = choice.id === selected;
          return (
            <button
              type="button"
              key={choice.id}
              className={active ? "setting-option is-selected" : "setting-option"}
              aria-pressed={active}
              onClick={() => onSelect(choice.id)}
            >
              <span aria-hidden="true">{active ? "✓" : "○"}</span>
              {choice.label}
            </button>
          );
        })}
      </div>
      <p className="setting-description">현재 선택: {selectedLabel}</p>
    </fieldset>
  );
}
