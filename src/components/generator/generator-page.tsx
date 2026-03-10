"use client";

import { useState } from "react";
import { ScriptGenerator } from "@/components/generator/script-generator";
import { IntroGenerator } from "@/components/generator/intro-generator";

export function GeneratorPage() {
  const [activeTab, setActiveTab] = useState<"script" | "intro">("script");
  const [generatedScript, setGeneratedScript] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-emerald-200 bg-clip-text text-transparent">
          콘텐츠 생성기
        </h1>
        <p className="text-xs text-white/30 mt-1">
          AI 기반 YouTube 대본 & 도입부 자동 생성
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
        <button
          onClick={() => setActiveTab("script")}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === "script"
              ? "bg-emerald-500/[0.15] text-emerald-300 border border-emerald-500/[0.2]"
              : "text-white/40 hover:text-white/60 border border-transparent"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            대본 생성기
          </div>
        </button>
        <button
          onClick={() => setActiveTab("intro")}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === "intro"
              ? "bg-emerald-500/[0.15] text-emerald-300 border border-emerald-500/[0.2]"
              : "text-white/40 hover:text-white/60 border border-transparent"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            도입부 생성기
            {generatedScript && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
        </button>
      </div>

      {/* Tab content */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6">
        {activeTab === "script" ? (
          <ScriptGenerator onScriptGenerated={setGeneratedScript} />
        ) : (
          <IntroGenerator scriptContent={generatedScript} />
        )}
      </div>
    </div>
  );
}
