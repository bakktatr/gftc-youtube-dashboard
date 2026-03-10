"use client";

import { useState } from "react";

interface SyncButtonProps {
  lastSyncAt: Date | null;
}

export function SyncButton({ lastSyncAt }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleSync = async () => {
    const mode = "full";
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });

      const data = await response.json();

      if (data.success) {
        setSyncResult(`${data.message}`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setSyncResult(`동기화 실패: ${data.error || "알 수 없는 오류"}`);
      }
    } catch (error) {
      setSyncResult(`동기화 실패: ${error}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return "동기화 기록 없음";
    const d = new Date(date);
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3">
      {/* Sync button with gradient */}
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="h-8 px-4 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
      >
        <span className="flex items-center gap-1.5">
          {isSyncing ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              동기화 중...
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M21.015 4.357v4.992" />
              </svg>
              데이터 동기화
            </>
          )}
        </span>
      </button>

      {/* Last sync info */}
      <span className="text-[11px] text-white/30">
        {formatLastSync(lastSyncAt)}
      </span>

      {syncResult && (
        <span className="text-[11px] font-medium text-emerald-300/80">{syncResult}</span>
      )}
    </div>
  );
}
