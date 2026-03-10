import { AdGenerator } from "@/components/generator/ad-generator";

export const dynamic = "force-dynamic";

export default function AdGeneratePage() {
  return (
    <main className="relative min-h-screen bg-[#08080C] overflow-hidden">
      {/* Background gradient orbs */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-[400px] -left-[300px] h-[800px] w-[800px] rounded-full bg-emerald-600/[0.07] blur-[120px]" />
        <div className="absolute -bottom-[300px] -right-[200px] h-[600px] w-[600px] rounded-full bg-teal-600/[0.05] blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-green-600/[0.03] blur-[100px]" />
      </div>
      <div className="relative container mx-auto px-6 py-10 max-w-[900px]">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-emerald-200 bg-clip-text text-transparent">
              광고 소재 생성기
            </h1>
            <p className="text-xs text-white/30 mt-1">
              Alex Hormozi 프레임워크 기반 Meta 광고 컨셉 자동 생성
            </p>
          </div>

          {/* Content */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6">
            <AdGenerator />
          </div>
        </div>
      </div>
    </main>
  );
}
