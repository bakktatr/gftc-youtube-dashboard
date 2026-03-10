"use client";

import { useState, useTransition } from "react";
import {
  createCategory,
  updateCategoryInfo,
  deleteCategory,
} from "@/actions/video-actions";
import {
  AVAILABLE_COLORS,
  getCategoryColorClass,
  getCategoryDotClass,
} from "@/lib/constants";

interface CategoryData {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

interface CategoryManagerProps {
  categories: CategoryData[];
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryManager({
  categories,
  isOpen,
  onClose,
}: CategoryManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("slate");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const startEdit = (cat: CategoryData) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setShowNew(false);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditColor("");
    setError(null);
  };

  const saveEdit = () => {
    if (!editName.trim()) {
      setError("카테고리 이름을 입력해주세요");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await updateCategoryInfo(editingId!, {
          name: editName.trim(),
          color: editColor,
        });
        setEditingId(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "수정 실패");
      }
    });
  };

  const handleCreate = () => {
    if (!newName.trim()) {
      setError("카테고리 이름을 입력해주세요");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await createCategory(newName.trim(), newColor);
        setNewName("");
        setNewColor("slate");
        setShowNew(false);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "생성 실패");
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`"${name}" 카테고리를 삭제하시겠습니까?\n해당 카테고리의 영상은 미분류로 변경됩니다.`)) return;
    startTransition(async () => {
      try {
        await deleteCategory(id);
        if (editingId === id) cancelEdit();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "삭제 실패");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 flex flex-col rounded-2xl border border-white/[0.1] bg-[#111113]/90 backdrop-blur-2xl shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white">카테고리 관리</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-5">
          {/* Chip grid */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => startEdit(cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${getCategoryColorClass(cat.color)} ${
                  editingId === cat.id
                    ? "ring-2 ring-white/30 brightness-125"
                    : "opacity-80 hover:opacity-100"
                }`}
              >
                {cat.name}
              </button>
            ))}

            {/* Add button */}
            {!showNew && (
              <button
                onClick={() => { setShowNew(true); setEditingId(null); setError(null); }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-white/35 border border-dashed border-white/[0.1] hover:text-white/55 hover:border-white/[0.2] hover:bg-white/[0.03] transition-all"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                추가
              </button>
            )}
          </div>

          {/* Edit panel */}
          {editingId && (
            <div className="mt-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">편집</span>
                <button
                  onClick={() => handleDelete(editingId, editName)}
                  className="text-[11px] text-white/30 hover:text-rose-400 transition-colors"
                >
                  삭제
                </button>
              </div>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                placeholder="카테고리 이름"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
              />
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditColor(c)}
                    className={`h-6 w-6 rounded-full ${getCategoryDotClass(c)} transition-all ${
                      editColor === c
                        ? "ring-2 ring-white/60 ring-offset-2 ring-offset-[#111113]"
                        : "opacity-50 hover:opacity-80"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={cancelEdit}
                  className="h-8 px-3 rounded-lg text-xs text-white/50 hover:text-white/70 bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={saveEdit}
                  disabled={isPending}
                  className="h-8 px-4 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                >
                  {isPending ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          )}

          {/* New category form */}
          {showNew && (
            <div className="mt-4 p-4 rounded-xl bg-white/[0.04] border border-dashed border-white/[0.1] space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
              <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">새 카테고리</span>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                placeholder="카테고리 이름"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") {
                    setShowNew(false);
                    setNewName("");
                    setError(null);
                  }
                }}
              />
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`h-6 w-6 rounded-full ${getCategoryDotClass(c)} transition-all ${
                      newColor === c
                        ? "ring-2 ring-white/60 ring-offset-2 ring-offset-[#111113]"
                        : "opacity-50 hover:opacity-80"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => { setShowNew(false); setNewName(""); setError(null); }}
                  className="h-8 px-3 rounded-lg text-xs text-white/50 hover:text-white/70 bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isPending}
                  className="h-8 px-4 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                >
                  {isPending ? "생성 중..." : "생성"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
