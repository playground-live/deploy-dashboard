import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * ブランチ名から `vX.Y.Z`(例: `v1.30.2`) 形式のバージョン文字列を抽出する。
 * 見つからない場合は元のブランチ名をそのまま返す。
 */
export function extractBranchVersion(branch: string): string {
  const match = branch.match(/v\d+\.\d+\.\d+/);
  return match ? match[0] : branch;
}
