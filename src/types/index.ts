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

export interface ServiceWithDeployments {
  id: string;
  repositoryId: string;
  name: string;
  repositoryName: string;
  description: string | null;
  displayOrder: number;
  deployments: Partial<Record<Environment, DeploymentInfo>>;
}

export interface ServiceInfo {
  id: string;
  repositoryId: string;
  name: string;
  repositoryName: string;
  description: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentHistoryResponse {
  items: DeploymentInfo[];
  nextCursor: string | null;
  hasMore: boolean;
}
