"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ENVIRONMENT_META, type Environment } from "@/lib/constants";
import type { DeploymentInfo, DeploymentHistoryResponse } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string | null;
  environment: Environment | null;
}

export function DeploymentHistoryDrawer({
  open,
  onOpenChange,
  serviceName,
  environment,
}: Props) {
  const [items, setItems] = useState<DeploymentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchHistory = useCallback(
    async (cursor?: string | null) => {
      if (!serviceName || !environment) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          service: serviceName,
          environment,
          limit: "20",
        });
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/deployments/history?${params}`);
        if (!res.ok) return;

        const data: DeploymentHistoryResponse = await res.json();
        setItems((prev) => (cursor ? [...prev, ...data.items] : data.items));
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      } catch (e) {
        console.error("Failed to fetch history:", e);
      } finally {
        setLoading(false);
      }
    },
    [serviceName, environment]
  );

  useEffect(() => {
    if (open && serviceName && environment) {
      setItems([]);
      setNextCursor(null);
      fetchHistory();
    }
  }, [open, serviceName, environment, fetchHistory]);

  const envLabel = environment ? ENVIRONMENT_META[environment].label : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="font-mono">{serviceName}</span>
            <Badge variant="outline">{envLabel}</Badge>
          </SheetTitle>
          <p className="text-sm text-muted-foreground">デプロイ履歴</p>
        </SheetHeader>

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-160px)]">
          <div className="space-y-3 pr-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`relative pl-6 pb-3 ${
                  index < items.length - 1 ? "border-l border-border ml-2" : "ml-2"
                }`}
              >
                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-background bg-muted -translate-x-1/2" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {item.tag ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-xs font-mono">
                        {item.tag}
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-mono">
                        {item.branch}
                      </Badge>
                    )}
                    {index === 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0"
                      >
                        最新
                      </Badge>
                    )}
                  </div>
                  {item.tag && (
                    <div className="text-xs text-muted-foreground">
                      ブランチ: {item.branch}
                    </div>
                  )}
                  <div className="text-xs font-mono text-muted-foreground">
                    {item.commitSha.slice(0, 12)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.deployedBy} &middot;{" "}
                    {new Date(item.deployedAt).toLocaleString("ja-JP")}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                デプロイ履歴がありません
              </div>
            )}

            {hasMore && !loading && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fetchHistory(nextCursor)}
              >
                さらに読み込む
              </Button>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
