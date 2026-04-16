import type { Environment } from "@/lib/constants";

export interface DeploymentInfo {
  id: string;
  serviceId: string;
  environment: string;
  tag: string | null;
  branch: string;
  commitSha: string;
  deployedBy: string;
  deployedAt: string;
}

export interface RepositoryInfo {
  id: string;
  githubId: string;
  fullName: string;
}

export interface ServiceGroupInfo {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
}

export interface ServiceInfo {
  id: string;
  serviceKey: string;
  name: string;
  description: string | null;
  displayOrder: number;
  repository: RepositoryInfo;
  group: ServiceGroupInfo | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceWithDeployments {
  id: string;
  serviceKey: string;
  name: string;
  description: string | null;
  displayOrder: number;
  repository: RepositoryInfo;
  group: ServiceGroupInfo | null;
  deployments: Partial<Record<Environment, DeploymentInfo>>;
}

export interface DeploymentHistoryResponse {
  items: DeploymentInfo[];
  nextCursor: string | null;
  hasMore: boolean;
}
