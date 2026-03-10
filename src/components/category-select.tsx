"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { getCategoryColorClass } from "@/lib/constants";
import { updateCategory } from "@/actions/video-actions";

interface DbCategory {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

interface CategorySelectProps {
  videoId: string;
  currentCategory: string | null;
  confidence: number | null;
  isManual: boolean;
  dbCategories: DbCategory[];
}

export function CategorySelect({
  videoId,
  currentCategory,
  confidence,
  isManual,
  dbCategories,
}: CategorySelectProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleChange = (value: string) => {
    setIsOpen(false);
    startTransition(async () => {
      await updateCategory(videoId, value);
    });
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const currentDbCat = dbCategories.find((c) => c.name === currentCategory);
  const badgeColor = currentDbCat
    ? getCategoryColorClass(currentDbCat.color)
    : currentCategory
      ? "bg-white/[0.06] text-white/60"
      : "";

  const isLowConfidence =
    !isManual && confidence !== null && confidence < 0.7;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`text-xs transition-all duration-150 ${isPending ? "opacity-50" : ""}`}
      >
        {currentCategory ? (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${badgeColor} ${
              isLowConfidence ? "ring-1 ring-amber-400/40" : ""
            }`}
          >
            {currentCategory}
            {isLowConfidence && (
              <span className="text-amber-400 text-[10px]">!</span>
            )}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-white/25 bg-white/[0.03] border border-dashed border-white/10 hover:border-white/20 hover:text-white/40 transition-colors">
            미분류
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-44 rounded-xl border border-white/[0.08] bg-[#141416] shadow-xl shadow-black/40 backdrop-blur-xl overflow-hidden py-1">
          {dbCategories.map((cat) => {
            const catColor = getCategoryColorClass(cat.color);
            const isSelected = currentCategory === cat.name;

            return (
              <button
                key={cat.id}
                onClick={() => handleChange(cat.name)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                  isSelected
                    ? "bg-white/[0.06]"
                    : "hover:bg-white/[0.06]"
                }`}
              >
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] ${catColor}`}
                >
                  {cat.name}
                </span>
                {isSelected && (
                  <svg className="ml-auto h-3 w-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
