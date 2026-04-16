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

interface GroupedServices {
  groupName: string | null;
  services: ServiceWithDeployments[];
}

function groupServices(services: ServiceWithDeployments[]): GroupedServices[] {
  const groups: Map<string | null, ServiceWithDeployments[]> = new Map();

  for (const service of services) {
    const key = service.group?.name ?? null;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(service);
  }

  const result: GroupedServices[] = [];
  // Named groups first (already sorted by group.displayOrder from API)
  for (const [key, svcs] of groups) {
    if (key !== null) result.push({ groupName: key, services: svcs });
  }
  // Ungrouped last
  const ungrouped = groups.get(null);
  if (ungrouped) result.push({ groupName: null, services: ungrouped });

  return result;
}

export function DashboardMatrix() {
  const [services, setServices] = useState<ServiceWithDeployments[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
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

  const handleCellClick = (serviceId: string, env: Environment) => {
    setSelectedServiceId(serviceId);
    setSelectedEnv(env);
    setDrawerOpen(true);
  };

  const selectedService = services.find((s) => s.id === selectedServiceId);

  if (loading) {
    return (
      <div className="space-y-3 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const grouped = groupServices(services);

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
              grouped.map((group) => (
                <>
                  {group.groupName && (
                    <TableRow key={`group-${group.groupName}`}>
                      <TableCell
                        colSpan={ENVIRONMENTS.length + 1}
                        className="sticky left-0 bg-muted/50 py-1.5 px-4 text-xs font-semibold text-muted-foreground"
                      >
                        {group.groupName}
                      </TableCell>
                    </TableRow>
                  )}
                  {group.services.map((service) => (
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
                              <div className="text-muted-foreground">
                                {service.repository.fullName}
                              </div>
                              <div className="font-mono">{service.serviceKey}</div>
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
                            onClick={() => handleCellClick(service.id, env)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DeploymentHistoryDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        serviceId={selectedServiceId}
        serviceName={selectedService?.name}
        environment={selectedEnv}
      />
    </>
  );
}
