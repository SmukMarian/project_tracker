import React, { useEffect, useMemo, useState } from 'react';
import { PM, Project, Step, Subtask } from '../types';

interface Props {
  project: Project;
  pmDirectory: PM[];
}

const statusLabel: Record<Step['status'], string> = {
  todo: 'Не начато',
  in_progress: 'В работе',
  blocked: 'Заблокировано',
  done: 'Завершено'
};

const StepsPanel: React.FC<Props> = ({ project, pmDirectory }) => {
  const [stepName, setStepName] = useState('');
  const [subtaskSearch, setSubtaskSearch] = useState('');
  const [selectedStepId, setSelectedStepId] = useState<number | null>(
    project.steps.length ? project.steps[0].id : null
  );
  const [activeTab, setActiveTab] = useState<'subtasks' | 'details'>('subtasks');

  useEffect(() => {
    setSelectedStepId(project.steps[0]?.id ?? null);
  }, [project.id, project.steps]);

  const selectedStep = project.steps.find((s) => s.id === selectedStepId) ?? null;

  const filteredSubtasks = useMemo(() => {
    if (!selectedStep) return [];
    return selectedStep.subtasks.filter((st) =>
      st.name.toLowerCase().includes(subtaskSearch.toLowerCase())
    );
  }, [selectedStep, subtaskSearch]);

  const pmName = (id?: number) => pmDirectory.find((pm) => pm.id === id)?.name ?? '—';

  return (
    <section className="steps-panel">
      <div className="step-toolbar">
        <input
          className="input"
          placeholder="Новый шаг… (Enter)"
          value={stepName}
          onChange={(e) => setStepName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && stepName.trim()) {
              // placeholder handler
              setStepName('');
            }
          }}
        />
        <button className="menu-button" disabled={!stepName.trim()}>
          Добавить шаг
        </button>
        <button className="menu-button" disabled={!selectedStepId}>
          Удалить выбранное
        </button>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'subtasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('subtasks')}
        >
          Подзадачи
        </button>
        <button
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Детали
        </button>
      </div>

      {activeTab === 'subtasks' && (
        <div className="subtasks">
          <div className="subtask-toolbar">
            <div className="left">
              <button className="menu-button" disabled={!selectedStepId}>
                Добавить подзадачу
              </button>
              <button className="menu-button" disabled={!selectedStepId}>
                Удалить подзадачу
              </button>
            </div>
            <input
              className="input"
              placeholder="Поиск по подзадачам…"
              value={subtaskSearch}
              onChange={(e) => setSubtaskSearch(e.target.value)}
            />
          </div>
          <div className="subtask-table">
            <div className="subtask-head">
              <span>ID</span>
              <span>Название</span>
              <span>Статус</span>
              <span>Исполнитель</span>
              <span>Целевая дата</span>
              <span>Вес</span>
              <span>Комментарий</span>
            </div>
            <div className="subtask-body">
              {filteredSubtasks.map((st: Subtask) => (
                <div key={st.id} className={`subtask-row status-${st.status}`}>
                  <span>{st.id}</span>
                  <span className="ellipsis" title={st.name}>
                    {st.name}
                  </span>
                  <span className={`status ${st.status}`}>{statusLabel[st.status]}</span>
                  <span>{pmName(st.assignee_id)}</span>
                  <span>{st.target_date ?? '—'}</span>
                  <span>{st.weight}</span>
                  <span className="ellipsis" title={st.comment}>
                    {st.comment || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'details' && selectedStep && (
        <div className="details-tab">
          <label htmlFor="step-comments">Комментарий по шагу</label>
          <textarea id="step-comments" className="textarea" defaultValue={selectedStep.comments} />
          <button className="menu-button align-end">Сохранить</button>
        </div>
      )}

      <div className="step-table">
        <div className="step-table-head">
          <span>ID</span>
          <span>Название</span>
          <span>Описание</span>
          <span>Статус</span>
          <span>Исполнитель</span>
          <span>Старт</span>
          <span>Цель</span>
          <span>Завершено</span>
          <span>Вес</span>
          <span>Комментарий</span>
        </div>
        <div className="step-table-body">
          {project.steps
            .slice()
            .sort((a, b) => a.order_index - b.order_index)
            .map((step: Step) => (
              <div
                key={step.id}
                className={`step-row ${selectedStepId === step.id ? 'selected' : ''}`}
                onClick={() => setSelectedStepId(step.id)}
              >
                <span>{step.id}</span>
                <span className="ellipsis" title={step.name}>
                  {step.name}
                </span>
                <span className="ellipsis" title={step.description}>
                  {step.description || '—'}
                </span>
                <span className={`status ${step.status}`}>{statusLabel[step.status]}</span>
                <span>{pmName(step.assignee_id)}</span>
                <span>{step.start_date ?? '—'}</span>
                <span>{step.target_date ?? '—'}</span>
                <span>{step.completed_date ?? '—'}</span>
                <span>{step.weight ?? 1}</span>
                <span className="ellipsis" title={step.comments}>
                  {step.comments || '—'}
                </span>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default StepsPanel;
