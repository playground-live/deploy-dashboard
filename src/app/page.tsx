import Link from "next/link";
import { DashboardMatrix } from "@/components/dashboard-matrix";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Deploy Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              各環境のデプロイ状況を一覧で確認
            </p>
          </div>
          <nav>
            <Link
              href="/services"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              サービス管理
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <DashboardMatrix />
      </main>
    </div>
  );
}
