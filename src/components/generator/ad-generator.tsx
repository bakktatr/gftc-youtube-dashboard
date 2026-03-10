"use client";

import { useState, useRef, useCallback } from "react";
import { ConceptCard } from "@/components/generator/concept-card";
import type { AdConcept } from "@/lib/generators/ad-concept-generator";

type Step = "input" | "loading" | "result";

const AGENT_STEPS = [
  { step: 1, name: "랜딩페이지 분석", desc: "Vision API로 제품/타겟 추출" },
  { step: 2, name: "크리에이티브 전략", desc: "Hormozi 프레임워크 적용" },
  { step: 3, name: "카피라이팅", desc: "한국어 후크/바디/CTA 작성" },
  { step: 4, name: "프롬프트 엔지니어링", desc: "3사이즈 이미지 프롬프트" },
];

export function AdGenerator() {
  // Input state
  const [url, setUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [extraContext, setExtraContext] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [adLanguage, setAdLanguage] = useState("한국어");

  // Result state
  const [step, setStep] = useState<Step>("input");
  const [concepts, setConcepts] = useState<AdConcept[]>([]);
  const [productSummary, setProductSummary] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미지 업로드 핸들러
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImagePreview(result);
        // data:image/jpeg;base64,... 에서 base64 부분만 추출
        const base64 = result.split(",")[1];
        setImageBase64(base64);
        setUrl(""); // URL 초기화
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // 드래그 앤 드롭
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      const base64 = result.split(",")[1];
      setImageBase64(base64);
      setUrl("");
    };
    reader.readAsDataURL(file);
  }, []);

  // 생성 실행
  const handleGenerate = async () => {
    if (!url && !imageBase64) {
      setError("랜딩페이지 URL 또는 이미지를 입력해주세요.");
      return;
    }

    setStep("loading");
    setError("");
    setConcepts([]);

    try {
      const res = await fetch("/api/generate/ad-concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url || undefined,
          imageBase64: imageBase64 || undefined,
          knowledgeBase: knowledgeBase || undefined,
          extraContext: extraContext || undefined,
          adLanguage,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setConcepts(data.concepts);
      setProductSummary(data.productSummary);
      setStep("result");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "광고 컨셉 생성에 실패했습니다."
      );
      setStep("input");
    }
  };

  // 전체 JSON 복사
  const handleCopyAll = async () => {
    const allData = JSON.stringify({ productSummary, concepts }, null, 2);
    try {
      await navigator.clipboard.writeText(allData);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = allData;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // JSON 다운로드
  const handleDownload = () => {
    const allData = JSON.stringify({ productSummary, concepts }, null, 2);
    const blob = new Blob([allData], { type: "application/json;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `ad-concepts-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const handleReset = () => {
    setStep("input");
    setConcepts([]);
    setProductSummary("");
    setError("");
  };

  return (
    <div className="space-y-5">
      {/* Description */}
      <p className="text-xs text-white/30 leading-relaxed">
        랜딩페이지 URL 또는 이미지를 입력하면, Alex Hormozi 마케팅 프레임워크
        기반으로 3개의 차별화된 Meta 광고 컨셉(후크/본문/CTA + 이미지 프롬프트)을
        자동 생성합니다.
      </p>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Step: Input */}
      {step === "input" && (
        <div className="space-y-5">
          {/* URL input */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">
              랜딩페이지 URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (e.target.value) {
                  setImagePreview(null);
                  setImageBase64(null);
                }
              }}
              placeholder="https://example.com/landing-page"
              className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* OR divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] text-white/20 uppercase tracking-widest">
              또는
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">
              랜딩페이지 이미지 업로드
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative w-full rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
                imagePreview
                  ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                  : "border-white/[0.1] bg-white/[0.02] hover:border-white/[0.2]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {imagePreview ? (
                <div className="p-3">
                  <img
                    src={imagePreview}
                    alt="랜딩페이지 미리보기"
                    className="max-h-40 mx-auto rounded-md object-contain"
                  />
                  <p className="text-[10px] text-emerald-300/60 text-center mt-2">
                    클릭하여 다른 이미지 선택
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <svg
                    className="h-8 w-8 mx-auto text-white/15 mb-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V5.25a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v14.25a1.5 1.5 0 0 0 1.5 1.5Z"
                    />
                  </svg>
                  <p className="text-xs text-white/30">
                    클릭 또는 드래그하여 이미지 업로드
                  </p>
                  <p className="text-[10px] text-white/15 mt-1">
                    JPG, PNG, WebP
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Extra context */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">
              추가 컨텍스트 (선택)
            </label>
            <textarea
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
              placeholder="예: 20-30대 직장인 타겟, 경쟁사 대비 가격 우위 강조..."
              className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 resize-none"
              rows={2}
            />
          </div>

          {/* Knowledge base */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">
              지식 베이스 (선택)
            </label>
            <textarea
              value={knowledgeBase}
              onChange={(e) => setKnowledgeBase(e.target.value)}
              placeholder="브랜드 가이드라인, 이전 캠페인 데이터, 제품 상세 정보 등..."
              className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 resize-none"
              rows={3}
            />
            {knowledgeBase && (
              <p className="mt-1 text-[10px] text-white/20 text-right">
                {knowledgeBase.length.toLocaleString()}자
                {knowledgeBase.length > 40000 && (
                  <span className="text-amber-400/60 ml-1">
                    (40,000자까지 사용됩니다)
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">
              광고 카피 언어
            </label>
            <div className="flex gap-2">
              {["한국어", "English"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setAdLanguage(lang)}
                  className={`flex-1 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                    adLanguage === lang
                      ? "border-emerald-500/50 bg-emerald-500/[0.08] text-white"
                      : "border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-white/[0.15]"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!url && !imageBase64}
            className="w-full py-3 px-4 rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            광고 소재 생성하기
          </button>
          <p className="text-[10px] text-white/20 text-center">
            4-에이전트 순차 실행 — 약 2~5분 소요
          </p>
        </div>
      )}

      {/* Step: Loading */}
      {step === "loading" && (
        <div className="py-12 space-y-8">
          {/* Progress steps */}
          <div className="space-y-3">
            {AGENT_STEPS.map((agent) => (
              <div
                key={agent.step}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.06]"
              >
                {/* Step indicator */}
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-emerald-500/20 text-emerald-300 animate-pulse">
                  {agent.step}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/70 font-medium">
                    {agent.name}
                  </p>
                  <p className="text-[10px] text-white/30">{agent.desc}</p>
                </div>
                <svg
                  className="h-4 w-4 animate-spin text-emerald-400/50"
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
              </div>
            ))}
          </div>

          <p className="text-xs text-white/30 text-center">
            4개 에이전트가 순차적으로 협업 중입니다. 잠시만 기다려주세요...
          </p>
        </div>
      )}

      {/* Step: Result */}
      {step === "result" && concepts.length > 0 && (
        <div className="space-y-4">
          {/* Product summary */}
          {productSummary && (
            <div className="p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/[0.15]">
              <p className="text-[10px] text-emerald-300/60 mb-0.5 uppercase tracking-wider font-semibold">
                제품 분석 요약
              </p>
              <p className="text-sm text-white/80">{productSummary}</p>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/40">
              {concepts.length}개 컨셉 생성 완료
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyAll}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors"
              >
                {copied ? "복사됨 ✓" : "전체 JSON 복사"}
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors"
              >
                JSON 다운로드
              </button>
            </div>
          </div>

          {/* Concept cards */}
          {concepts.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} />
          ))}

          {/* Reset */}
          <button
            onClick={handleReset}
            className="w-full py-2.5 px-4 rounded-lg text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors"
          >
            새로운 랜딩페이지로 다시 생성
          </button>
        </div>
      )}
    </div>
  );
}
