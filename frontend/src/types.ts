export type Status = 'todo' | 'in_progress' | 'blocked' | 'done';

export type ProjectStatus = 'active' | 'archived';

export interface PM {
  id: number;
  name: string;
}

export interface Subtask {
  id: number;
  name: string;
  status: Status;
  assignee_id?: number;
  target_date?: string;
  weight: number;
  order_index: number;
  comment?: string;
}

export interface Step {
  id: number;
  name: string;
  description?: string;
  status: Status;
  assignee_id?: number;
  start_date?: string;
  target_date?: string;
  completed_date?: string;
  weight?: number;
  order_index: number;
  comments?: string;
  subtasks: Subtask[];
  progress_percent: number;
}

export interface Project {
  id: number;
  name: string;
  code?: string;
  status: ProjectStatus;
  category_id?: number;
  owner_id?: number;
  start_date?: string;
  target_date?: string;
  description?: string;
  moq?: number;
  base_price?: number;
  retail_price?: number;
  progress_percent: number;
  cover_image?: string;
  media_path?: string;
  steps: Step[];
  inprogress_coeff?: number;
  attachments?: Attachment[];
}

export interface Attachment {
  id: number;
  path: string;
  added_at?: string;
  project_id?: number;
  step_id?: number;
}

export interface Category {
  id: number;
  name: string;
  projects: Project[];
}

export type ProjectListItem = Pick<
  Project,
  'id' | 'name' | 'code' | 'status' | 'start_date' | 'target_date' | 'progress_percent' | 'category_id'
>;

export interface CategoryWithProjects {
  id: number;
  name: string;
  projects: ProjectListItem[];
}

export interface WorkspaceState {
  path: string;
}

export interface KpiReport {
  total_projects: number;
  active_projects: number;
  archived_projects: number;
  average_progress: number;
  steps_total: number;
  steps_done: number;
  subtasks_total: number;
  subtasks_done: number;
}
