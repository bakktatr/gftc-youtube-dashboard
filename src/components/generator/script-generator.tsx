"use client";

import { useState } from "react";
import { TopicCard } from "@/components/generator/topic-card";
import type { Topic } from "@/lib/generators/topic-generator";
import type { ProductKey } from "@/lib/generators/config";

interface ScriptGeneratorProps {
  onScriptGenerated?: (script: string) => void;
}

type Step = 1 | 2 | 3;

export function ScriptGenerator({ onScriptGenerated }: ScriptGeneratorProps) {
  // Step 1 state
  const [contentType, setContentType] = useState<string>("풀링");
  const [cta, setCta] = useState<ProductKey>("lead_magnet");
  const [userInput, setUserInput] = useState("");

  // Step 2 state
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  // Step 3 state
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [script, setScript] = useState("");
  const [isLoadingScript, setIsLoadingScript] = useState(false);

  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Step 1 → 2: 주제 추천
  const handleSuggestTopics = async () => {
    setIsLoadingTopics(true);
    setError("");
    try {
      const res = await fetch("/api/generate/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput, cta }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setTopics(data.topics);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "주제 추천 실패");
    } finally {
      setIsLoadingTopics(false);
    }
  };

  // Step 2 → 3: 대본 생성
  const handleGenerateScript = async (topic: Topic) => {
    setSelectedTopic(topic);
    setIsLoadingScript(true);
    setError("");
    setStep(3);
    try {
      const res = await fetch("/api/generate/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedTopic: topic, contentType, cta }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setScript(data.script);
      onScriptGenerated?.(data.script);
    } catch (err) {
      setError(err instanceof Error ? err.message : "대본 생성 실패");
    } finally {
      setIsLoadingScript(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = script;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = (format: "txt" | "md") => {
    const ext = format;
    const blob = new Blob([script], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gftc-script-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setStep(1);
    setTopics([]);
    setSelectedTopic(null);
    setScript("");
    setError("");
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                step >= s
                  ? "bg-emerald-500/80 text-white"
                  : "bg-white/[0.06] text-white/25"
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`w-8 h-px ${
                  step > s ? "bg-emerald-500/40" : "bg-white/[0.06]"
                }`}
              />
            )}
          </div>
        ))}
        <span className="ml-2 text-xs text-white/30">
          {step === 1
            ? "유형 & 퍼널 설정"
            : step === 2
              ? "주제 선택"
              : "대본 생성"}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Step 1: Setup */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Content type */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">
              콘텐츠 유형
            </label>
            <div className="flex gap-2">
              {[
                { value: "풀링", label: "풀링 콘텐츠", desc: "유입용, 조회수 극대화" },
                { value: "키", label: "키 콘텐츠", desc: "수익화, 전환 중심" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setContentType(opt.value)}
                  className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                    contentType === opt.value
                      ? "border-emerald-500/50 bg-emerald-500/[0.08]"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
                  }`}
                >
                  <p className="text-sm font-medium text-white">{opt.label}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">
              CTA (행동 유도)
            </label>
            <div className="flex gap-2">
              {[
                { value: "lead_magnet" as ProductKey, label: "무료 기초이론 PDF" },
                { value: "seminar" as ProductKey, label: "오프라인 세미나" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCta(opt.value)}
                  className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                    cta === opt.value
                      ? "border-emerald-500/50 bg-emerald-500/[0.08]"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
                  }`}
                >
                  <p className="text-sm font-medium text-white">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* User input */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">
              추가 요청사항 (선택)
            </label>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="예: 비트코인 관련, 초보자 대상, 최근 시황 반영..."
              className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 resize-none"
              rows={3}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSuggestTopics}
            disabled={isLoadingTopics}
            className="w-full py-3 px-4 rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoadingTopics ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                주제 추천 중... (1~2분 소요)
              </>
            ) : (
              "주제 3개 추천받기"
            )}
          </button>
        </div>
      )}

      {/* Step 2: Topic selection */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/40">추천된 주제 중 하나를 선택하세요</p>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              ← 다시 설정
            </button>
          </div>
          {topics.map((topic) => (
            <TopicCard
              key={topic.topic_number}
              topic={topic}
              onSelect={handleGenerateScript}
              isLoading={isLoadingScript}
            />
          ))}
        </div>
      )}

      {/* Step 3: Script result */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Selected topic info */}
          {selectedTopic && (
            <div className="p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/[0.15]">
              <p className="text-xs text-emerald-300/60 mb-0.5">선택된 주제</p>
              <p className="text-sm text-white/80">
                {selectedTopic.title_ideas[0]}
              </p>
            </div>
          )}

          {isLoadingScript ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <svg
                className="h-8 w-8 animate-spin text-emerald-400"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              <p className="text-sm text-white/40">대본 생성 중... (2~4분 소요)</p>
            </div>
          ) : script ? (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/30">
                    {script.length.toLocaleString()}자
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors"
                  >
                    {copied ? "✅ 복사됨" : "📋 복사"}
                  </button>
                  <button
                    onClick={() => handleDownload("txt")}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors"
                  >
                    TXT
                  </button>
                  <button
                    onClick={() => handleDownload("md")}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors"
                  >
                    MD
                  </button>
                </div>
              </div>

              {/* Script content */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 max-h-[600px] overflow-y-auto">
                <pre className="text-sm text-white/80 whitespace-pre-wrap font-[inherit] leading-relaxed">
                  {script}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-2.5 px-4 rounded-lg text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors"
                >
                  새로운 주제로 생성
                </button>
                <button
                  onClick={() => {
                    setScript("");
                    if (selectedTopic) handleGenerateScript(selectedTopic);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-lg text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors"
                >
                  같은 주제로 재생성
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
