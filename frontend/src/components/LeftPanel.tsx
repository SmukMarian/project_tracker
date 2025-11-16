import React from 'react';
import { Category } from '../types';

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
  workspacePath
}) => {
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
        />
      </div>
      <div className="list-block projects">
        <div className="list-title">Проекты</div>
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
                return text.includes(projectFilter.toLowerCase());
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
                  <span>{p.startDate ?? '—'}</span>
                  <span>{p.targetDate ?? '—'}</span>
                  <span>{p.progress}%</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LeftPanel;
