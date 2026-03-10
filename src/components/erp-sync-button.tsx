"use client";

import { useState } from "react";

interface ErpSyncButtonProps {
  lastSyncAt: Date | null;
}

export function ErpSyncButton({ lastSyncAt }: ErpSyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch("/api/erp-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      {/* ERP Sync button with amber/orange gradient */}
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="h-8 px-4 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25"
      >
        <span className="flex items-center gap-1.5">
          {isSyncing ? (
            <>
              <svg
                className="h-3.5 w-3.5 animate-spin"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              ERP 동기화 중...
            </>
          ) : (
            <>
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              ERP 동기화
            </>
          )}
        </span>
      </button>

      {/* Last sync info */}
      <span className="text-[11px] text-white/30">
        {formatLastSync(lastSyncAt)}
      </span>

      {syncResult && (
        <span className="text-[11px] font-medium text-amber-300/80">
          {syncResult}
        </span>
      )}
    </div>
  );
}
