import React from 'react';
import { PM, Project } from '../types';

interface Props {
  project: Project;
  pmDirectory: PM[];
}

const ProjectCard: React.FC<Props> = ({ project, pmDirectory }) => {
  const owner = pmDirectory.find((pm) => pm.id === project.owner);
  return (
    <section className="project-card">
      <div className="cover" aria-label="Обложка проекта">
        {project.coverUrl ? <img src={project.coverUrl} alt="Обложка" /> : <div className="cover-placeholder">Без обложки</div>}
      </div>
      <div className="project-meta">
        <div className="project-title" title={project.name}>
          <span className="name">{project.name}</span>
          {project.code && <span className="code">{project.code}</span>}
        </div>
        <div className="status-row">
          <span className={`status chip ${project.status.toLowerCase()}`}>{project.status}</span>
          {owner && <span className="chip">PM: {owner.name}</span>}
          <span className="chip">Старт: {project.startDate ?? '—'}</span>
          <span className="chip">Цель: {project.targetDate ?? '—'}</span>
        </div>
        <p className="description">{project.description || 'Описание проекта пока не заполнено.'}</p>
        <div className="numbers-row">
          <div className="number-field">
            <div className="label">MOQ</div>
            <div className="value">{project.moq ?? '—'}</div>
          </div>
          <div className="number-field">
            <div className="label">Базовая цена</div>
            <div className="value">{project.basePrice ?? '—'}</div>
          </div>
          <div className="number-field">
            <div className="label">Розничная цена</div>
            <div className="value">{project.retailPrice ?? '—'}</div>
          </div>
        </div>
        <div className="progress">
          <div className="progress-bar" style={{ width: `${project.progress}%` }} />
          <span className="progress-label">{project.progress}% выполнения</span>
        </div>
        <div className="actions-row">
          <button className="menu-button">Изменить карточку…</button>
          <button className="menu-button">Характеристики…</button>
          <button className="menu-button">Медиатека</button>
          <button className="menu-button">Excel</button>
          <button className="menu-button">Word</button>
          <button className="menu-button">Презентация категории</button>
        </div>
      </div>
    </section>
  );
};

export default ProjectCard;
