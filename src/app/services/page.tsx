"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ServiceFormDialog } from "@/components/service-form";
import type { ServiceInfo } from "@/types";

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editService, setEditService] = useState<ServiceInfo | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch("/api/services");
      if (res.ok) setServices(await res.json());
    } catch (e) {
      console.error("Failed to fetch services:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleAdd = () => {
    setEditService(null);
    setDialogOpen(true);
  };

  const handleEdit = (service: ServiceInfo) => {
    setEditService(service);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">サービス管理</h1>
            <p className="text-sm text-muted-foreground">
              デプロイ対象サービスの登録・編集
            </p>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ダッシュボード
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            {services.length} サービス
          </span>
          <Button onClick={handleAdd}>サービスを追加</Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">表示順</TableHead>
                <TableHead>サービス名</TableHead>
                <TableHead>リポジトリ</TableHead>
                <TableHead>リポジトリID</TableHead>
                <TableHead>説明</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    読み込み中...
                  </TableCell>
                </TableRow>
              ) : services.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    サービスが登録されていません
                  </TableCell>
                </TableRow>
              ) : (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="text-center font-mono text-sm">
                      {service.displayOrder}
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {service.name}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`https://github.com/${service.repositoryName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {service.repositoryName.split("/").pop()}
                      </a>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {service.repositoryId}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {service.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(service)}
                      >
                        編集
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <ServiceFormDialog
        key={editService?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={editService}
        onSaved={fetchServices}
      />
    </div>
  );
}
