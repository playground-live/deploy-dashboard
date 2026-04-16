import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * ブランチ名から表示用の短い文字列を返す。
 * 1. `vX.Y.Z` パターンがあればそれを抽出 (例: `release/.../v1.30.2/...` → `v1.30.2`)
 * 2. スラッシュを含む長いブランチ名は、最初のスラッシュ以降の先頭5文字 + `...` に短縮
 *    (例: `feature/payment-retry` → `payme...`)
 * 3. それ以外はそのまま返す (例: `main`, `test`)
 */
export function extractBranchVersion(branch: string): string {
  const versionMatch = branch.match(/v\d+\.\d+\.\d+/);
  if (versionMatch) return versionMatch[0];

  const slashIndex = branch.indexOf("/");
  if (slashIndex >= 0) {
    const afterSlash = branch.slice(slashIndex + 1);
    if (afterSlash.length > 8) {
      return afterSlash.slice(0, 5) + "...";
    }
    return afterSlash;
  }

  return branch;
}
