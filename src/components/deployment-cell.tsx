"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DeploymentInfo } from "@/types";

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}時間前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}日前`;
  return new Date(dateStr).toLocaleDateString("ja-JP");
}

interface DeploymentCellProps {
  deployment: DeploymentInfo | undefined;
  onClick?: () => void;
}

export function DeploymentCell({ deployment, onClick }: DeploymentCellProps) {
  if (!deployment) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60px] text-muted-foreground text-xs">
        &mdash;
      </div>
    );
  }

  const isTagged = Boolean(deployment.tag);
  const displayVersion = deployment.tag || deployment.branch;
  const shortSha = deployment.commitSha.slice(0, 7);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Badge
              variant={isTagged ? "default" : "secondary"}
              className={`text-xs font-mono truncate max-w-[140px] ${
                isTagged
                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200"
                  : "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
              }`}
            >
              {displayVersion}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
            <span>{shortSha}</span>
            <span className="mx-0.5">&middot;</span>
            <span>{formatRelativeTime(deployment.deployedAt)}</span>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[280px]">
        <div className="space-y-1 text-xs">
          {deployment.tag && (
            <div>
              <span className="text-muted-foreground">タグ: </span>
              {deployment.tag}
            </div>
          )}
          <div>
            <span className="text-muted-foreground">ブランチ: </span>
            {deployment.branch}
          </div>
          <div>
            <span className="text-muted-foreground">コミット: </span>
            <span className="font-mono">{deployment.commitSha.slice(0, 12)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">デプロイ者: </span>
            {deployment.deployedBy}
          </div>
          <div>
            <span className="text-muted-foreground">デプロイ日時: </span>
            {new Date(deployment.deployedAt).toLocaleString("ja-JP")}
            {" "}
            ({formatRelativeTime(deployment.deployedAt)})
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
