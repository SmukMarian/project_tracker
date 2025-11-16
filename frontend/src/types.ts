export type Status = 'todo' | 'in_progress' | 'blocked' | 'done';

export interface PM {
  id: number;
  name: string;
}

export interface Subtask {
  id: number;
  name: string;
  status: Status;
  assignee?: number;
  targetDate?: string;
  weight: number;
  orderIndex: number;
  comment?: string;
}

export interface Step {
  id: number;
  name: string;
  description?: string;
  status: Status;
  assignee?: number;
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  weight?: number;
  orderIndex: number;
  comments?: string;
  subtasks: Subtask[];
  progress: number;
}

export interface Project {
  id: number;
  name: string;
  code?: string;
  status: 'Active' | 'Archived';
  owner?: number;
  startDate?: string;
  targetDate?: string;
  description?: string;
  moq?: number;
  basePrice?: number;
  retailPrice?: number;
  progress: number;
  coverUrl?: string;
  mediaFolder?: string;
  steps: Step[];
  inProgressCoeff?: number;
}

export interface Category {
  id: number;
  name: string;
  projects: Project[];
}
