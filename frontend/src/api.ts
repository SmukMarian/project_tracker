import { Category, PM, WorkspaceState } from './types';

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

export async function fetchPMs(): Promise<PM[]> {
  return getJson<PM[]>('/pms');
}

export async function fetchCategories(): Promise<Category[]> {
  return getJson<Category[]>('/categories');
}
