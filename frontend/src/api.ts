import {
  Attachment,
  Category,
  KpiReport,
  PM,
  Project,
  ProjectStatus,
  Step,
  Subtask,
  WorkspaceState
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchWorkspace(): Promise<WorkspaceState> {
  return getJson<WorkspaceState>('/workspace');
}

export async function setWorkspace(path: string): Promise<WorkspaceState> {
  const res = await fetch(`${API_BASE}/workspace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path })
  });
  if (!res.ok) {
    throw new Error('Failed to update workspace');
  }
  return (await res.json()) as WorkspaceState;
}

export async function fetchPMs(): Promise<PM[]> {
  return getJson<PM[]>('/pms');
}

export async function fetchCategories(): Promise<Category[]> {
  return getJson<Category[]>('/categories');
}

export async function createCategory(payload: { name: string }): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error('Failed to create category');
  }
  return (await res.json()) as Category;
}

export async function updateCategory(id: number, payload: { name: string }): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error('Failed to update category');
  }
  return (await res.json()) as Category;
}

export async function deleteCategory(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error('Failed to delete category');
  }
}

export interface ProjectQuery {
  category_id?: number;
  owner_id?: number;
  status?: string;
  search?: string;
}

export interface ProjectPayload {
  category_id: number;
  name: string;
  code?: string;
  status?: ProjectStatus;
  owner_id?: number;
  start_date?: string;
  target_date?: string;
  description?: string;
  moq?: number;
  base_price?: number;
  retail_price?: number;
  inprogress_coeff?: number;
}

export async function fetchProjects(query: ProjectQuery = {}): Promise<Project[]> {
  const params = new URLSearchParams();
  if (query.category_id) params.set('category_id', String(query.category_id));
  if (query.owner_id) params.set('owner_id', String(query.owner_id));
  if (query.status) params.set('status', query.status);
  if (query.search) params.set('search', query.search);
  const suffix = params.toString() ? `/projects?${params.toString()}` : '/projects';
  return getJson<Project[]>(suffix);
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error('Failed to create project');
  }
  return (await res.json()) as Project;
}

export async function updateProject(projectId: number, payload: Partial<ProjectPayload>): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error('Failed to update project');
  }
  return (await res.json()) as Project;
}

export async function deleteProject(projectId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error('Failed to delete project');
  }
}

export async function fetchSteps(
  projectId: number,
  query: { status?: string; assignee_id?: number; search?: string } = {}
): Promise<Step[]> {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.assignee_id) params.set('assignee_id', String(query.assignee_id));
  if (query.search) params.set('search', query.search);
  const suffix = params.toString()
    ? `/projects/${projectId}/steps?${params.toString()}`
    : `/projects/${projectId}/steps`;
  return getJson<Step[]>(suffix);
}

export interface StepCreatePayload {
  project_id: number;
  name: string;
  description?: string;
  status?: string;
  assignee_id?: number;
  start_date?: string;
  target_date?: string;
  completed_date?: string;
  order_index?: number;
  weight?: number;
  comments?: string;
}

export async function createStep(payload: StepCreatePayload): Promise<Step> {
  const res = await fetch(`${API_BASE}/steps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error('Failed to create step');
  }
  return (await res.json()) as Step;
}

export async function updateStep(stepId: number, payload: Partial<StepCreatePayload>): Promise<Step> {
  const res = await fetch(`${API_BASE}/steps/${stepId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error('Failed to update step');
  }
  return (await res.json()) as Step;
}

export async function deleteStep(stepId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/steps/${stepId}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error('Failed to delete step');
  }
}

export async function fetchSubtasks(
  stepId: number,
  query: { status?: string; search?: string } = {}
): Promise<Subtask[]> {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.search) params.set('search', query.search);
  const suffix = params.toString()
    ? `/steps/${stepId}/subtasks?${params.toString()}`
    : `/steps/${stepId}/subtasks`;
  return getJson<Subtask[]>(suffix);
}

export interface SubtaskCreatePayload {
  step_id: number;
  name: string;
  status?: string;
  target_date?: string;
  completed_date?: string;
  order_index?: number;
  weight?: number;
}

export async function createSubtask(payload: SubtaskCreatePayload): Promise<Subtask> {
  const res = await fetch(`${API_BASE}/subtasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error('Failed to create subtask');
  }
  return (await res.json()) as Subtask;
}

export async function deleteSubtask(subtaskId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/subtasks/${subtaskId}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error('Failed to delete subtask');
  }
}

export async function fetchProjectAttachments(projectId: number): Promise<Attachment[]> {
  return getJson<Attachment[]>(`/projects/${projectId}/attachments`);
}

export async function fetchStepAttachments(stepId: number): Promise<Attachment[]> {
  return getJson<Attachment[]>(`/steps/${stepId}/attachments`);
}

export async function uploadAttachment(payload: {
  project_id?: number;
  step_id?: number;
  file: File;
}): Promise<Attachment> {
  const form = new FormData();
  form.append('file', payload.file);
  if (payload.project_id) form.append('project_id', String(payload.project_id));
  if (payload.step_id) form.append('step_id', String(payload.step_id));
  const res = await fetch(`${API_BASE}/attachments/upload`, {
    method: 'POST',
    body: form
  });
  if (!res.ok) {
    throw new Error('Failed to upload attachment');
  }
  return (await res.json()) as Attachment;
}

export async function deleteAttachment(attachmentId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/attachments/${attachmentId}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error('Failed to delete attachment');
  }
}

export async function fetchKpi(categoryId?: number): Promise<KpiReport> {
  const params = new URLSearchParams();
  if (categoryId) params.set('category_id', String(categoryId));
  const suffix = params.toString() ? `/kpi?${params.toString()}` : '/kpi';
  return getJson<KpiReport>(suffix);
}
