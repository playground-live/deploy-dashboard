export const ENVIRONMENTS = [
  "dev",
  "test",
  "test2",
  "test3",
  "sandbox",
  "stg",
  "prod",
] as const;

export type Environment = (typeof ENVIRONMENTS)[number];

export const ENVIRONMENT_META: Record<
  Environment,
  { label: string; description: string }
> = {
  dev: {
    label: "Dev",
    description: "開発環境。mainブランチまたは機能ブランチがデプロイされる",
  },
  test: {
    label: "Test",
    description: "テスト環境。testブランチのマージでデプロイされる",
  },
  test2: {
    label: "Test2",
    description: "自動テスト環境。testブランチのマージでデプロイされる",
  },
  test3: {
    label: "Test3",
    description:
      "並行テスト環境。workflow_dispatchで任意ブランチをデプロイ可能",
  },
  sandbox: {
    label: "Sandbox",
    description:
      "サンドボックス環境。タグデプロイまたはworkflow_dispatchで任意ブランチ",
  },
  stg: {
    label: "Staging",
    description: "ステージング環境。prodブランチ + vタグでデプロイ",
  },
  prod: {
    label: "Production",
    description: "本番環境。prodブランチ + vタグでデプロイ",
  },
};
