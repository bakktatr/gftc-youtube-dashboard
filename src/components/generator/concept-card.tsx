"use client";

import { useState } from "react";
import type { AdConcept } from "@/lib/generators/ad-concept-generator";

interface ConceptCardProps {
  concept: AdConcept;
}

export function ConceptCard({ concept }: ConceptCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // 감정 어필 컬러 매핑
  const principleColors: Record<string, string> = {
    "Grand Slam Offer": "bg-amber-500/20 text-amber-300",
    "Value Equation": "bg-sky-500/20 text-sky-300",
    "Lead with Pain": "bg-rose-500/20 text-rose-300",
    Specificity: "bg-violet-500/20 text-violet-300",
    "Hook First": "bg-orange-500/20 text-orange-300",
    "Simple Language": "bg-teal-500/20 text-teal-300",
    "Strong CTA": "bg-emerald-500/20 text-emerald-300",
  };

  const principleClass =
    principleColors[concept.hormozi_principle] ||
    "bg-white/10 text-white/60";

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm overflow-hidden transition-all hover:border-white/[0.15]">
      {/* Header */}
      <button
        type="button"
        className="w-full px-5 py-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${principleClass}`}
              >
                {concept.hormozi_principle}
              </span>
              {concept.visual_hook_type_ko && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/15 text-indigo-300">
                  {concept.visual_hook_type_ko}
                </span>
              )}
              <span className="text-xs text-white/30">
                컨셉 {concept.id}
              </span>
            </div>
            <h3 className="text-sm font-medium text-white leading-snug">
              {concept.name}
            </h3>
          </div>
          <svg
            className={`h-4 w-4 text-white/30 shrink-0 mt-1 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19 9-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/[0.06] pt-4">
          {/* Copy section — hook/body/cta */}
          <div className="space-y-3">
            {/* Hook */}
            <div className="p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/[0.12]">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase tracking-wider text-emerald-300/60 font-semibold">
                  후크 (Hook)
                </p>
                <button
                  onClick={() => handleCopy(concept.hook, "hook")}
                  className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                >
                  {copiedField === "hook" ? "복사됨 ✓" : "복사"}
                </button>
              </div>
              <p className="text-sm text-white/90 font-medium">
                {concept.hook}
              </p>
            </div>

            {/* Body */}
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">
                  본문 (Body)
                </p>
                <button
                  onClick={() => handleCopy(concept.body, "body")}
                  className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                >
                  {copiedField === "body" ? "복사됨 ✓" : "복사"}
                </button>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                {concept.body}
              </p>
            </div>

            {/* CTA */}
            <div className="p-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/[0.12]">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase tracking-wider text-amber-300/60 font-semibold">
                  CTA
                </p>
                <button
                  onClick={() => handleCopy(concept.cta, "cta")}
                  className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                >
                  {copiedField === "cta" ? "복사됨 ✓" : "복사"}
                </button>
              </div>
              <p className="text-sm text-white/90 font-medium">
                {concept.cta}
              </p>
            </div>
          </div>

          {/* Visual composition */}
          {concept.image_composition_ko && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-semibold">
                비주얼 구성
              </p>
              <p className="text-xs text-white/60 leading-relaxed">
                {concept.image_composition_ko}
              </p>
            </div>
          )}

          {/* Text overlay specs */}
          {concept.text_overlay && concept.text_overlay.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-semibold">
                텍스트 오버레이
              </p>
              <div className="space-y-1.5">
                {concept.text_overlay.map((overlay, i) => (
                  <div
                    key={i}
                    className="flex gap-2 text-xs text-white/50"
                  >
                    <span className="text-white/25 shrink-0 w-8">
                      [{overlay.position}]
                    </span>
                    <span className="flex-1">
                      {overlay.text}
                      {overlay.style && (
                        <span className="text-white/20 ml-1">
                          — {overlay.style}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image prompts */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2 font-semibold">
              이미지 생성 프롬프트
            </p>
            <div className="space-y-2">
              {[
                {
                  key: "square_1080x1080" as const,
                  label: "Square 1080×1080",
                  badge: "1:1",
                },
                {
                  key: "story_1080x1920" as const,
                  label: "Story 1080×1920",
                  badge: "9:16",
                },
                {
                  key: "landscape_1200x628" as const,
                  label: "Landscape 1200×628",
                  badge: "2:1",
                },
              ].map(({ key, label, badge }) => (
                <div
                  key={key}
                  className="rounded-lg bg-white/[0.02] border border-white/[0.06] overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-white/25 bg-white/[0.06] px-1.5 py-0.5 rounded">
                        {badge}
                      </span>
                      <span className="text-[11px] text-white/40">
                        {label}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleCopy(
                          concept.prompts[key] || "",
                          key
                        )
                      }
                      className="text-[10px] px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.1] text-white/40 hover:text-white/60 transition-colors"
                    >
                      {copiedField === key ? "복사됨 ✓" : "복사"}
                    </button>
                  </div>
                  <p className="px-3 py-2 text-[11px] text-white/50 leading-relaxed font-mono">
                    {concept.prompts[key] || "(없음)"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
