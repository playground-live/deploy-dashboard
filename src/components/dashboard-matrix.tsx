"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { DeploymentCell } from "@/components/deployment-cell";
import { DeploymentHistoryDrawer } from "@/components/deployment-history-drawer";
import { ENVIRONMENTS, ENVIRONMENT_META, type Environment } from "@/lib/constants";
import type { ServiceWithDeployments } from "@/types";

const REFRESH_INTERVAL = 30_000;

export function DashboardMatrix() {
  const [services, setServices] = useState<ServiceWithDeployments[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [selectedEnv, setSelectedEnv] = useState<Environment | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/deployments");
      if (res.ok) {
        const data = await res.json();
        setServices(data);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error("Failed to fetch deployments:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCellClick = (repositoryId: string, env: Environment) => {
    setSelectedRepoId(repositoryId);
    setSelectedEnv(env);
    setDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-3 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
        <span>
          {services.length} サービス &times; {ENVIRONMENTS.length} 環境
        </span>
        {lastUpdated && (
          <span>
            最終更新: {lastUpdated.toLocaleTimeString("ja-JP")}
            （{REFRESH_INTERVAL / 1000}秒ごとに自動更新）
          </span>
        )}
      </div>

      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 bg-background min-w-[160px] border-r">
                サービス
              </TableHead>
              {ENVIRONMENTS.map((env) => {
                const meta = ENVIRONMENT_META[env];
                return (
                  <TableHead key={env} className="text-center min-w-[160px]">
                    <Tooltip>
                      <TooltipTrigger className="cursor-help">
                        {meta.label}
                      </TooltipTrigger>
                      <TooltipContent>{meta.description}</TooltipContent>
                    </Tooltip>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={ENVIRONMENTS.length + 1}
                  className="text-center py-12 text-muted-foreground"
                >
                  サービスが登録されていません。
                  サービス管理画面から追加するか、デプロイAPIを呼び出してください。
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="sticky left-0 z-10 bg-background border-r font-medium">
                    <Tooltip>
                      <TooltipTrigger className="text-left">
                        <div className="font-mono text-sm">{service.name}</div>
                        {service.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[140px]">
                            {service.description}
                          </div>
                        )}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="text-xs space-y-0.5">
                          <div className="text-muted-foreground">ID: {service.repositoryId}</div>
                          <div>{service.repositoryName}</div>
                          {service.description && (
                            <div className="text-muted-foreground mt-1">
                              {service.description}
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  {ENVIRONMENTS.map((env) => (
                    <TableCell key={env} className="p-1">
                      <DeploymentCell
                        deployment={service.deployments[env]}
                        onClick={() => handleCellClick(service.repositoryId, env)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DeploymentHistoryDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        repositoryId={selectedRepoId}
        serviceName={services.find((s) => s.repositoryId === selectedRepoId)?.name}
        environment={selectedEnv}
      />
    </>
  );
}
