"use client";

import { useState } from "react";
import type { Topic } from "@/lib/generators/topic-generator";

interface TopicCardProps {
  topic: Topic;
  onSelect: (topic: Topic) => void;
  isLoading: boolean;
}

export function TopicCard({ topic, onSelect, isLoading }: TopicCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isPulling = topic.content_type === "풀링";

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
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                  isPulling
                    ? "bg-sky-500/20 text-sky-300"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {topic.content_type}
              </span>
              <span className="text-xs text-white/30">
                주제 {topic.topic_number}
              </span>
            </div>
            <h3 className="text-sm font-medium text-white leading-snug">
              {topic.title_ideas[0]}
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
        <div className="px-5 pb-4 space-y-3 border-t border-white/[0.06] pt-3">
          {/* Title ideas */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5">
              제목 아이디어
            </p>
            <ul className="space-y-1">
              {topic.title_ideas.map((title, i) => (
                <li key={i} className="text-xs text-white/70 flex gap-2">
                  <span className="text-white/25 shrink-0">{i + 1}.</span>
                  {title}
                </li>
              ))}
            </ul>
          </div>

          {/* Thumbnail concept */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">
              썸네일 컨셉
            </p>
            <p className="text-xs text-white/60">{topic.thumbnail_concept}</p>
          </div>

          {/* Target emotion */}
          <div className="flex gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">
                타겟 감정
              </p>
              <p className="text-xs text-white/60">{topic.target_emotion}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">
                퍼널 역할
              </p>
              <p className="text-xs text-white/60">
                {topic.sales_funnel_role}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">
              방향
            </p>
            <p className="text-xs text-white/60">
              {topic.brief_description}
            </p>
          </div>

          {/* Select button */}
          <button
            onClick={() => onSelect(topic)}
            disabled={isLoading}
            className="w-full mt-2 py-2 px-4 rounded-lg text-xs font-medium bg-emerald-600/80 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이 주제로 대본 생성
          </button>
        </div>
      )}
    </div>
  );
}
