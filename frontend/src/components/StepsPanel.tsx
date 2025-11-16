import React, { useEffect, useMemo, useState } from 'react';
import { fetchSteps } from '../api';
import { PM, Project, Step, Status, Subtask } from '../types';

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
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'subtasks' | 'details'>('subtasks');
  const [steps, setSteps] = useState<Step[]>(project.steps);
  const [stepStatusFilter, setStepStatusFilter] = useState<Status | 'all'>('all');
  const [stepAssigneeFilter, setStepAssigneeFilter] = useState<number | 'all'>('all');
  const [stepSearch, setStepSearch] = useState('');
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  useEffect(() => {
    setSteps(project.steps);
    setSelectedStepId(project.steps[0]?.id ?? null);
    setSubtaskSearch('');
    setStepError(null);
  }, [project.id, project.steps]);

  useEffect(() => {
    if (!steps.length) {
      setSelectedStepId(null);
      return;
    }
    const hasCurrent = steps.some((s) => s.id === selectedStepId);
    if (!hasCurrent) {
      setSelectedStepId(steps[0].id);
    }
  }, [steps, selectedStepId]);

  useEffect(() => {
    let isMounted = true;
    const loadSteps = async () => {
      setLoadingSteps(true);
      try {
        const fetched = await fetchSteps(project.id, {
          status: stepStatusFilter === 'all' ? undefined : stepStatusFilter,
          assignee_id: stepAssigneeFilter === 'all' ? undefined : stepAssigneeFilter,
          search: stepSearch || undefined
        });
        if (!isMounted) return;
        setSteps(fetched.length ? fetched : project.steps);
        if (!fetched.length) {
          setStepError('Нет данных от API, показаны локальные шаги.');
        } else {
          setStepError(null);
        }
        if (!selectedStepId && fetched.length) {
          setSelectedStepId(fetched[0].id);
        }
      } catch (err) {
        if (!isMounted) return;
        setStepError('API шагов недоступно, показаны локальные данные.');
        setSteps(project.steps);
      } finally {
        if (!isMounted) return;
        setLoadingSteps(false);
      }
    };
    loadSteps();
    return () => {
      isMounted = false;
    };
  }, [project.id, project.steps, stepAssigneeFilter, stepSearch, stepStatusFilter]);

  const selectedStep = steps.find((s) => s.id === selectedStepId) ?? null;

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
        <input
          className="input"
          placeholder="Поиск по шагам…"
          value={stepSearch}
          onChange={(e) => setStepSearch(e.target.value)}
        />
        <select
          className="input select"
          value={stepStatusFilter}
          onChange={(e) => setStepStatusFilter(e.target.value as Status | 'all')}
        >
          <option value="all">Все статусы</option>
          <option value="todo">Не начато</option>
          <option value="in_progress">В работе</option>
          <option value="blocked">Заблокировано</option>
          <option value="done">Завершено</option>
        </select>
        <select
          className="input select"
          value={stepAssigneeFilter}
          onChange={(e) =>
            setStepAssigneeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
          }
        >
          <option value="all">Все исполнители</option>
          {pmDirectory.map((pm) => (
            <option key={pm.id} value={pm.id}>
              {pm.name}
            </option>
          ))}
        </select>
      </div>

      {loadingSteps && <div className="info">Загрузка шагов…</div>}
      {stepError && <div className="info warning">{stepError}</div>}

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
          {steps
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
