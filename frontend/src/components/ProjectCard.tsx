import React from 'react';
import { PM, Project } from '../types';

interface Props {
  project: Project;
  pmDirectory: PM[];
  onExportWord: () => void;
  onExportPresentation: () => void;
  onEdit?: () => void;
}

const ProjectCard: React.FC<Props> = ({ project, pmDirectory, onExportWord, onExportPresentation, onEdit }) => {
  const owner = pmDirectory.find((pm) => pm.id === project.owner_id);
  const projectStatusLabel: Record<Project['status'], string> = {
    active: 'Active',
    archived: 'Archived'
  };
  return (
    <section className="project-card">
      <div className="cover" aria-label="Обложка проекта">
        {project.cover_image ? (
          <img src={project.cover_image} alt="Обложка" />
        ) : (
          <div className="cover-placeholder">Без обложки</div>
        )}
      </div>
      <div className="project-meta">
        <div className="project-title" title={project.name}>
          <span className="name">{project.name}</span>
          {project.code && <span className="code">{project.code}</span>}
        </div>
        <div className="status-row">
          <span className={`status chip ${project.status}`}>{projectStatusLabel[project.status]}</span>
          {owner && <span className="chip">PM: {owner.name}</span>}
          <span className="chip">Старт: {project.start_date ?? '—'}</span>
          <span className="chip">Цель: {project.target_date ?? '—'}</span>
        </div>
        <p className="description">{project.description || 'Описание проекта пока не заполнено.'}</p>
        <div className="numbers-row">
          <div className="number-field">
            <div className="label">MOQ</div>
            <div className="value">{project.moq ?? '—'}</div>
          </div>
          <div className="number-field">
            <div className="label">Базовая цена</div>
            <div className="value">{project.base_price ?? '—'}</div>
          </div>
          <div className="number-field">
            <div className="label">Розничная цена</div>
            <div className="value">{project.retail_price ?? '—'}</div>
          </div>
        </div>
        <div className="progress">
          <div className="progress-bar" style={{ width: `${project.progress_percent}%` }} />
          <span className="progress-label">{project.progress_percent}% выполнения</span>
        </div>
        <div className="actions-row">
          <button className="menu-button" onClick={onEdit}>
            Изменить карточку…
          </button>
          <button className="menu-button">Характеристики…</button>
          <button className="menu-button">Медиатека</button>
          <button className="menu-button" onClick={() => window.open('http://localhost:8000/export/categories/excel', '_blank')}>
            Excel
          </button>
          <button className="menu-button" onClick={onExportWord}>
            Word
          </button>
          <button className="menu-button" onClick={onExportPresentation}>
            Презентация категории
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProjectCard;
