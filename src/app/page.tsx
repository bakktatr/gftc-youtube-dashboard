import { Dashboard } from "@/components/dashboard";
import { getVideos, getCategories, getLastSyncInfo } from "@/actions/video-queries";
import { getAllCategories } from "@/actions/video-actions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [videos, categories, syncInfo, dbCategories] = await Promise.all([
    getVideos(),
    getCategories(),
    getLastSyncInfo(),
    getAllCategories(),
  ]);

  return (
    <main className="relative min-h-screen bg-[#08080C] overflow-hidden">
      {/* Background gradient orbs */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-[400px] -left-[300px] h-[800px] w-[800px] rounded-full bg-emerald-600/[0.07] blur-[120px]" />
        <div className="absolute -bottom-[300px] -right-[200px] h-[600px] w-[600px] rounded-full bg-teal-600/[0.05] blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-green-600/[0.03] blur-[100px]" />
      </div>
      <div className="relative container mx-auto px-6 py-10 max-w-[1320px]">
        <Dashboard
          initialVideos={videos}
          categories={categories}
          dbCategories={dbCategories}
          lastSyncAt={syncInfo.settings?.lastSyncAt ?? null}
          erpLastSyncAt={syncInfo.settings?.erpLastSyncAt ?? null}
        />
      </div>
    </main>
  );
}
