export type ProjectStatus = "draft" | "active" | "archived";

export type OpenStudioProject = {
  id: string;
  name: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type CreateProjectInput = {
  id?: string;
  name?: string;
  metadata?: Record<string, unknown>;
};

export type UpdateProjectInput = {
  name?: string;
  status?: ProjectStatus;
  metadata?: Record<string, unknown>;
};

export type ProjectFileEntry = {
  name: string;
  path: string;
  size: number;
  mtime: number;
  kind: "text" | "image" | "video" | "audio" | "json" | "markdown" | "binary";
  mime: string;
};
