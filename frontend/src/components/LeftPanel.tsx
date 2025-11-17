import React from 'react';
import { parseTokens } from '../search';
import { Category, Project } from '../types';

interface Props {
  categories: Category[];
  selectedCategoryId: number | null;
  selectedProjectId: number | null;
  onSelectCategory: (id: number) => void;
  onSelectProject: (categoryId: number, projectId: number) => void;
  categoryFilter: string;
  projectFilter: string;
  onCategoryFilter: (value: string) => void;
  onProjectFilter: (value: string) => void;
  workspacePath: string;
  projectFilterRef: React.RefObject<HTMLInputElement>;
  onEditCategory?: (category: Category) => void;
  onDeleteCategory?: (category: Category) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
}

const LeftPanel: React.FC<Props> = ({
  categories,
  selectedCategoryId,
  selectedProjectId,
  onSelectCategory,
  onSelectProject,
  categoryFilter,
  projectFilter,
  onCategoryFilter,
  onProjectFilter,
  workspacePath,
  projectFilterRef
}) => {
  const parsedProjectFilter = parseTokens(projectFilter);
  return (
    <aside className="sidebar">
      <div className="workspace-path" title={workspacePath}>
        {workspacePath || 'Workspace не выбран'}
      </div>
      <div className="filter-block">
        <input
          className="input"
          placeholder="Фильтр категорий…"
          value={categoryFilter}
          onChange={(e) => onCategoryFilter(e.target.value)}
        />
        <button className="small-button" onClick={() => onCategoryFilter('')}>
          Очистить
        </button>
      </div>
      <div className="list-block">
        <div className="list-title">Категории</div>
        <div className="inline-actions">
          <button
            className="small-button"
            onClick={() => {
              const current = categories.find((c) => c.id === selectedCategoryId);
              if (current && onEditCategory) onEditCategory(current);
            }}
            disabled={!selectedCategoryId || !onEditCategory}
          >
            Редактировать
          </button>
          <button
            className="small-button danger"
            onClick={() => {
              const current = categories.find((c) => c.id === selectedCategoryId);
              if (current && onDeleteCategory) onDeleteCategory(current);
            }}
            disabled={!selectedCategoryId || !onDeleteCategory}
          >
            Удалить
          </button>
        </div>
        <div className="list">
          {categories
            .filter((c) => c.name.toLowerCase().includes(categoryFilter.toLowerCase()))
            .map((c) => (
              <div
                key={c.id}
                className={`list-item ${selectedCategoryId === c.id ? 'selected' : ''}`}
                onClick={() => onSelectCategory(c.id)}
              >
                <span>{c.name}</span>
                <span className="badge">{c.projects.length}</span>
              </div>
            ))}
        </div>
      </div>

      <div className="filter-block">
        <input
          className="input"
          placeholder="Поиск по проектам…"
          value={projectFilter}
          onChange={(e) => onProjectFilter(e.target.value)}
          ref={projectFilterRef}
        />
      </div>
      <div className="list-block projects">
        <div className="list-title">Проекты</div>
        <div className="inline-actions">
          <button
            className="small-button"
            onClick={() => {
              const current = categories
                .find((c) => c.id === selectedCategoryId)
                ?.projects.find((p) => p.id === selectedProjectId);
              if (current && onEditProject) onEditProject(current);
            }}
            disabled={!selectedProjectId || !onEditProject}
          >
            Редактировать
          </button>
          <button
            className="small-button danger"
            onClick={() => {
              const current = categories
                .find((c) => c.id === selectedCategoryId)
                ?.projects.find((p) => p.id === selectedProjectId);
              if (current && onDeleteProject) onDeleteProject(current);
            }}
            disabled={!selectedProjectId || !onDeleteProject}
          >
            Удалить
          </button>
        </div>
        <div className="project-table">
          <div className="project-table-head">
            <span>ID</span>
            <span>Название</span>
            <span>Код</span>
            <span>Статус</span>
            <span>Старт</span>
            <span>Цель</span>
            <span>%</span>
          </div>
          <div className="project-table-body">
            {categories
              .filter((c) => selectedCategoryId === null || c.id === selectedCategoryId)
              .flatMap((c) => c.projects.map((p) => ({ ...p, categoryId: c.id })))
              .filter((p) => {
                const text = `${p.name} ${p.code ?? ''} ${p.status}`.toLowerCase();
                const matchesText = parsedProjectFilter.text
                  ? text.includes(parsedProjectFilter.text.toLowerCase())
                  : true;
                const matchesStatus = parsedProjectFilter.status
                  ? p.status.toLowerCase() === parsedProjectFilter.status.toLowerCase()
                  : true;
                return matchesText && matchesStatus;
              })
              .map((p) => (
                <div
                  key={p.id}
                  className={`project-row ${selectedProjectId === p.id ? 'selected' : ''}`}
                  onClick={() => onSelectProject(p.categoryId, p.id)}
                >
                  <span>{p.id}</span>
                  <span className="ellipsis" title={p.name}>
                    {p.name}
                  </span>
                  <span>{p.code}</span>
                  <span className={`status ${p.status.toLowerCase()}`}>{p.status}</span>
                  <span>{p.start_date ?? '—'}</span>
                  <span>{p.target_date ?? '—'}</span>
                  <span>{p.progress_percent}%</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LeftPanel;
