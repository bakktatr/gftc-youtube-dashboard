"use client";

import { useState } from "react";

interface IntroGeneratorProps {
  /** 대본 생성기에서 전달된 대본 텍스트 */
  scriptContent?: string;
}

export function IntroGenerator({ scriptContent }: IntroGeneratorProps) {
  const [content, setContent] = useState(scriptContent || "");
  const [styleNote, setStyleNote] = useState("");
  const [intro, setIntro] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!content.trim()) {
      setError("본문 내용을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate/intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, styleNote }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setIntro(data.intro);
    } catch (err) {
      setError(err instanceof Error ? err.message : "도입부 생성 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(intro);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = intro;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // scriptContent가 변경되면 content에 반영
  const handleUseScript = () => {
    if (scriptContent) {
      setContent(scriptContent);
    }
  };

  return (
    <div className="space-y-5">
      {/* Description */}
      <p className="text-xs text-white/30 leading-relaxed">
        본문 내용(시황 분석, 차트 해설 등)을 입력하면 &apos;차트보는 서울대생(차설)&apos;
        스타일의 도입부(헤드)를 자동 생성합니다.
      </p>

      {/* Use script button */}
      {scriptContent && (
        <button
          onClick={handleUseScript}
          className="w-full py-2.5 px-4 rounded-lg text-xs font-medium bg-emerald-500/[0.08] border border-emerald-500/[0.2] text-emerald-300/80 hover:bg-emerald-500/[0.12] transition-colors"
        >
          대본 생성기에서 생성된 대본 가져오기
        </button>
      )}

      {/* Content input */}
      <div>
        <label className="block text-xs font-medium text-white/50 mb-2">
          본문 내용 (바디)
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="영상의 메인 내용을 입력하세요. 시황 분석, 차트 해설, 매매 전략 등..."
          className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 resize-none"
          rows={8}
        />
        <p className="mt-1 text-[10px] text-white/20 text-right">
          {content.length.toLocaleString()}자
        </p>
      </div>

      {/* Style note */}
      <div>
        <label className="block text-xs font-medium text-white/50 mb-2">
          추가 스타일 요청 (선택)
        </label>
        <input
          type="text"
          value={styleNote}
          onChange={(e) => setStyleNote(e.target.value)}
          placeholder="예: 좀 더 긴박한 느낌으로, 질문형으로 시작 등"
          className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={isLoading || !content.trim()}
        className="w-full py-3 px-4 rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
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
            도입부 생성 중... (30초~1분 소요)
          </>
        ) : (
          "도입부(헤드) 생성하기"
        )}
      </button>

      {/* Result */}
      {intro && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/70">생성된 도입부</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/25">
                {intro.length}자
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors"
              >
                {copied ? "✅ 복사됨" : "📋 복사"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
            <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
              {intro}
            </p>
          </div>

          {/* Regenerate */}
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-lg text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors disabled:opacity-50"
          >
            다시 생성하기
          </button>
          <p className="text-[10px] text-white/20 text-center">
            매번 다른 결과가 나옵니다. 마음에 들지 않으면 다시 생성해보세요.
          </p>
        </div>
      )}
    </div>
  );
}
