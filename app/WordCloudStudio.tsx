"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CloudCanvas } from "./components/CloudCanvas";
import { InfoDialog } from "./components/InfoDialog";
import { QuickSettings } from "./components/QuickSettings";
import { TextWorkspace } from "./components/TextWorkspace";
import { WordFrequency } from "./components/WordFrequency";
import { DEFAULT_SETTINGS, normalizeSettings } from "./lib/cloud-options.mjs";
import { analyzeText, MAX_TEXT_LENGTH, parseList } from "./lib/word-analysis.mjs";

type Settings = typeof DEFAULT_SETTINGS;
type CloudWord = { text: string; count: number; weight: number; keywordRank: number | null };
type CloudResult = { words: CloudWord[] };
type DialogType = "help" | "updates" | null;

const ERROR_MESSAGES = {
  empty: "먼저 학생 답변이나 수업 내용을 붙여넣어 주세요.",
  insufficient: "두 글자 이상의 단어를 조금 더 입력해 주세요.",
} as const;

export function WordCloudStudio() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [text, setText] = useState("");
  const [excluded, setExcluded] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [result, setResult] = useState<CloudResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const restorePreferences = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem("cloud-classroom-settings");
        if (saved) setSettings(normalizeSettings(JSON.parse(saved)));
      } catch {
        // Invalid browser preferences are ignored in favor of safe defaults.
      } finally {
        setPreferencesLoaded(true);
      }
    }, 0);
    return () => window.clearTimeout(restorePreferences);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    const preferences = {
      maskId: settings.maskId,
      paletteId: settings.paletteId,
      fontId: settings.fontId,
      wordCount: settings.wordCount,
    };
    try {
      window.localStorage.setItem("cloud-classroom-settings", JSON.stringify(preferences));
    } catch {
      // The app remains usable when a browser blocks local preferences.
    }
  }, [preferencesLoaded, settings]);

  const generate = useCallback(() => {
    const analysis = analyzeText({
      text,
      excludedWords: parseList(excluded),
      keywords,
      limit: 100,
    });
    if (analysis.error) {
      setResult(null);
      const error = ERROR_MESSAGES[analysis.error as keyof typeof ERROR_MESSAGES];
      setWorkspaceError(error);
      setStatusMessage(null);
      return;
    }
    setWorkspaceError(null);
    setPreviewError(null);
    setResult({ words: analysis.words });
    setStatusMessage(`워드 클라우드를 만들었어요. ${analysis.words.length}개의 단어를 찾았어요.`);
  }, [excluded, keywords, text]);

  const changeSettings = useCallback((nextSettings: Settings) => {
    setSettings(nextSettings);
    if (result) generate();
  }, [generate, result]);

  const changeKeywords = useCallback((value: string) => {
    const nextKeywords = parseList(value);
    if (nextKeywords.length > 3) {
      const error = "핵심어는 최대 3개까지 입력할 수 있어요.";
      setWorkspaceError(error);
      setStatusMessage(null);
      return;
    }
    setKeywords(nextKeywords);
    if (workspaceError === "핵심어는 최대 3개까지 입력할 수 있어요.") {
      setWorkspaceError(null);
      setStatusMessage(null);
    }
  }, [workspaceError]);

  const displayedWords = useMemo(
    () => result?.words.slice(0, settings.wordCount) ?? [],
    [result, settings.wordCount],
  );

  const openDialog = useCallback((type: Exclude<DialogType, null>, opener: HTMLButtonElement) => {
    openerRef.current = opener;
    setActiveDialog(type);
  }, []);

  const closeDialog = useCallback(() => {
    setActiveDialog(null);
    window.requestAnimationFrame(() => openerRef.current?.focus());
  }, []);

  const reportDownloadError = useCallback(() => {
    setPreviewError("PNG 저장에 실패했어요.");
    setStatusMessage(null);
  }, []);

  return (
    <main className="studio-shell">
      <header className="studio-header">
        <div className="brand-lockup">
          <svg className="brand-mark" aria-hidden="true" viewBox="0 0 48 36" fill="none">
            <path d="M13 29h22.5a8.5 8.5 0 0 0 .7-17 12.5 12.5 0 0 0-23.7 3.3A7 7 0 0 0 13 29Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="m32.5 5 .8 2.1 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.1Z" fill="currentColor" />
          </svg>
          <div>
            <h1>클라우드 수업실</h1>
            <p>학생들의 생각을 한눈에 모아보세요.</p>
          </div>
        </div>
        <div className="header-actions">
          <p className="privacy-notice">광고 없음 <span aria-hidden="true">·</span> 서버 저장 없음</p>
          <div>
            <button type="button" onClick={(event) => openDialog("help", event.currentTarget)}>도움말</button>
            <button type="button" onClick={(event) => openDialog("updates", event.currentTarget)}>업데이트 내역</button>
          </div>
        </div>
      </header>

      <p className="sr-only" aria-live="polite">{statusMessage ?? ""}</p>
      <section className="preview-panel" aria-labelledby="preview-title">
        <div className="section-heading">
          <div>
            <h2 id="preview-title">수업 워드 클라우드</h2>
            <p>{result ? "설정을 바꾸면 결과가 바로 달라져요." : "예시를 보거나 학생 답변을 붙여넣어 시작해 보세요."}</p>
          </div>
        </div>
        <CloudCanvas result={result} settings={settings} onDownloadError={reportDownloadError} />
        {previewError ? <p className="preview-error" role="alert"><strong>{previewError}</strong> 저장 버튼을 다시 눌러 주세요.</p> : null}
      </section>

      <QuickSettings settings={settings} onChange={changeSettings} />
      <div className="workspace-grid">
        <TextWorkspace
          text={text}
          excluded={excluded}
          keywords={keywords}
          error={workspaceError}
          truncated={text.length > MAX_TEXT_LENGTH}
          onTextChange={setText}
          onExcludedChange={setExcluded}
          onKeywordsChange={changeKeywords}
          onGenerate={generate}
        />
        <WordFrequency words={displayedWords} />
      </div>
      {activeDialog ? <InfoDialog type={activeDialog} onClose={closeDialog} /> : null}
    </main>
  );
}
