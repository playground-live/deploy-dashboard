"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ServiceInfo } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: ServiceInfo | null;
  onSaved: () => void;
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  onSaved,
}: Props) {
  const isEdit = Boolean(service);
  const [repositoryId, setRepositoryId] = useState(service?.repositoryId ?? "");
  const [name, setName] = useState(service?.name ?? "");
  const [repositoryName, setRepositoryName] = useState(service?.repositoryName ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [displayOrder, setDisplayOrder] = useState(
    service?.displayOrder ?? 0
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body = isEdit
        ? { id: service!.id, name, description, displayOrder }
        : { repositoryId, name, repositoryName, description, displayOrder };

      const res = await fetch("/api/services", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "保存に失敗しました");
      }

      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "サービスを編集" : "サービスを追加"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayOrder">表示順</Label>
            <Input
              id="displayOrder"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">サービス名</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="User API"
              required
            />
          </div>
          {isEdit ? (
            <div className="space-y-2">
              <Label>リポジトリ</Label>
              <div className="px-3 py-2 rounded-md bg-muted text-sm font-mono text-muted-foreground">
                {service!.repositoryName}
              </div>
              <p className="text-xs text-muted-foreground">
                CDパイプラインから自動で更新されます
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="repositoryName">リポジトリ名</Label>
              <Input
                id="repositoryName"
                value={repositoryName}
                onChange={(e) => setRepositoryName(e.target.value)}
                placeholder="myorg/user-api"
                required
              />
            </div>
          )}
          {isEdit ? (
            <div className="space-y-2">
              <Label>リポジトリID</Label>
              <div className="px-3 py-2 rounded-md bg-muted text-sm font-mono text-muted-foreground">
                {service!.repositoryId}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="repositoryId">リポジトリID</Label>
              <Input
                id="repositoryId"
                value={repositoryId}
                onChange={(e) => setRepositoryId(e.target.value)}
                placeholder="123456789"
                required
              />
              <p className="text-xs text-muted-foreground">
                GitHubリポジトリの数値ID。CDパイプラインからは自動取得されます
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ユーザー管理API"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
