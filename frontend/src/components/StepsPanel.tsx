import React, { useEffect, useMemo, useState } from 'react';
import {
  createStep,
  createSubtask,
  deleteStep,
  deleteSubtask,
  fetchSteps,
  fetchSubtasks,
  updateStep,
  updateSubtask
} from '../api';
import AttachmentModal from './AttachmentModal';
import StepDialog from './StepDialog';
import { parseTokens } from '../search';
import { PM, Project, Step, Status, Subtask } from '../types';

interface Props {
  project: Project;
  pmDirectory: PM[];
  workspacePath?: string;
  onMetricsChanged?: () => void;
}

const statusLabel: Record<Step['status'], string> = {
  todo: 'Не начато',
  in_progress: 'В работе',
  blocked: 'Заблокировано',
  done: 'Завершено'
};

const StepsPanel: React.FC<Props> = ({ project, pmDirectory, workspacePath, onMetricsChanged }) => {
  const [stepName, setStepName] = useState('');
  const [subtaskSearch, setSubtaskSearch] = useState('');
  const [subtaskStatusFilter, setSubtaskStatusFilter] = useState<Status | 'all'>('all');
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'subtasks' | 'details'>('subtasks');
  const [steps, setSteps] = useState<Step[]>(project.steps);
  const [stepStatusFilter, setStepStatusFilter] = useState<Status | 'all'>('all');
  const [stepAssigneeFilter, setStepAssigneeFilter] = useState<number | 'all'>('all');
  const [stepSearch, setStepSearch] = useState('');
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [subtaskError, setSubtaskError] = useState<string | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>(project.steps[0]?.subtasks ?? []);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<number | null>(
    project.steps[0]?.subtasks[0]?.id ?? null
  );
  const [subtaskName, setSubtaskName] = useState('');
  const [subtaskStatus, setSubtaskStatus] = useState<Status>('todo');
  const [subtaskAssignee, setSubtaskAssignee] = useState<number | 'unassigned'>('unassigned');
  const [subtaskTargetDate, setSubtaskTargetDate] = useState('');
  const [subtaskCompletedDate, setSubtaskCompletedDate] = useState('');
  const [subtaskWeight, setSubtaskWeight] = useState('1');
  const [subtaskComment, setSubtaskComment] = useState('');
  const [stepComments, setStepComments] = useState(project.steps[0]?.comments ?? '');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionTone, setActionTone] = useState<'info' | 'warning'>('info');
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [showStepAttachments, setShowStepAttachments] = useState(false);
  const notifyMetrics = () => onMetricsChanged?.();

  useEffect(() => {
    setSteps(project.steps);
    setSelectedStepId(project.steps[0]?.id ?? null);
    setSubtaskSearch('');
    setSubtaskStatusFilter('all');
    setStepError(null);
    setSubtaskError(null);
    setSelectedSubtaskId(project.steps[0]?.subtasks[0]?.id ?? null);
    setStepComments(project.steps[0]?.comments ?? '');
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

  useEffect(() => {
    if (selectedStep) {
      setStepComments(selectedStep.comments ?? '');
    }
  }, [selectedStepId, selectedStep]);

  useEffect(() => {
    if (!selectedStepId || !selectedStep) {
      setSubtasks([]);
      setSelectedSubtaskId(null);
      return;
    }
    let isMounted = true;
    const loadSubtasks = async () => {
      setLoadingSubtasks(true);
      try {
        const fetched = await fetchSubtasks(selectedStepId, {
          status: subtaskStatusFilter === 'all' ? undefined : subtaskStatusFilter,
          search: subtaskSearch || undefined
        });
        if (!isMounted) return;
        if (fetched.length) {
          setSubtasks(fetched);
          setSubtaskError(null);
        } else {
          setSubtasks(selectedStep.subtasks);
          setSubtaskError('Нет данных от API, показаны локальные подзадачи.');
        }
        setSelectedSubtaskId((prev) => {
          const collection = fetched.length ? fetched : selectedStep.subtasks;
          if (prev && collection.some((st) => st.id === prev)) return prev;
          return collection[0]?.id ?? null;
        });
      } catch (err) {
        if (!isMounted) return;
        setSubtasks(selectedStep.subtasks);
        setSubtaskError('API подзадач недоступно, показаны локальные данные.');
        setSelectedSubtaskId((prev) => {
          if (prev && selectedStep.subtasks.some((st) => st.id === prev)) return prev;
          return selectedStep.subtasks[0]?.id ?? null;
        });
      } finally {
        if (!isMounted) return;
        setLoadingSubtasks(false);
      }
    };
    loadSubtasks();
    return () => {
      isMounted = false;
    };
  }, [selectedStepId, selectedStep, subtaskSearch, subtaskStatusFilter]);

  useEffect(() => {
    if (!selectedStepId) return;
    setSteps((prev) =>
      prev.map((s) => (s.id === selectedStepId ? { ...s, subtasks } : s))
    );
  }, [selectedStepId, subtasks]);

  useEffect(() => {
    if (!subtasks.length) {
      setSelectedSubtaskId(null);
      return;
    }
    const hasCurrent = subtasks.some((st) => st.id === selectedSubtaskId);
    if (!hasCurrent) {
      setSelectedSubtaskId(subtasks[0].id);
    }
  }, [selectedSubtaskId, subtasks]);

  const selectedSubtask =
    subtasks.find((st) => st.id === selectedSubtaskId) ?? subtasks[0] ?? null;

  useEffect(() => {
    if (!selectedSubtask) {
      setSubtaskName('');
      setSubtaskStatus('todo');
      setSubtaskAssignee('unassigned');
      setSubtaskTargetDate('');
      setSubtaskCompletedDate('');
      setSubtaskWeight('1');
      setSubtaskComment('');
      return;
    }
    setSubtaskName(selectedSubtask.name);
    setSubtaskStatus(selectedSubtask.status);
    setSubtaskAssignee(selectedSubtask.assignee_id ?? 'unassigned');
    setSubtaskTargetDate(selectedSubtask.target_date ?? '');
    setSubtaskCompletedDate(selectedSubtask.completed_date ?? '');
    setSubtaskWeight(String(selectedSubtask.weight ?? 1));
    setSubtaskComment(selectedSubtask.comment ?? '');
  }, [selectedSubtask, selectedSubtaskId]);

  const filteredSubtasks = useMemo(() => {
    const parsed = parseTokens(subtaskSearch);
    return subtasks.filter((st) => {
      const matchesText = parsed.text
        ? st.name.toLowerCase().includes(parsed.text.toLowerCase())
        : true;
      const matchesStatus = parsed.status
        ? st.status.toLowerCase() === parsed.status.toLowerCase()
        : true;
      const matchesStatusFilter =
        subtaskStatusFilter === 'all' ? true : st.status === subtaskStatusFilter;
      const matchesWeight = parsed.weightValue
        ? parsed.weightComparator === '>'
          ? st.weight > parsed.weightValue
          : parsed.weightComparator === '<'
          ? st.weight < parsed.weightValue
          : st.weight === parsed.weightValue
        : true;
      return matchesText && matchesStatus && matchesStatusFilter && matchesWeight;
    });
  }, [subtaskSearch, subtaskStatusFilter, subtasks]);

  const pmName = (id?: number) => pmDirectory.find((pm) => pm.id === id)?.name ?? '—';

  const filteredSteps = useMemo(() => {
    const parsed = parseTokens(stepSearch);
    return steps.filter((step) => {
      const haystack = `${step.name} ${step.description ?? ''}`.toLowerCase();
      const matchesText = parsed.text ? haystack.includes(parsed.text.toLowerCase()) : true;
      const matchesStatus = parsed.status
        ? step.status.toLowerCase() === parsed.status.toLowerCase()
        : true;
      const matchesWeight = parsed.weightValue && step.weight !== undefined
        ? parsed.weightComparator === '>'
          ? step.weight > parsed.weightValue
          : parsed.weightComparator === '<'
          ? step.weight < parsed.weightValue
          : step.weight === parsed.weightValue
        : true;
      return matchesText && matchesStatus && matchesWeight;
    });
  }, [stepSearch, steps]);

  const handleAddStep = () => {
    if (!stepName.trim()) return;
    const tempId = Date.now() * -1;
    const optimisticStep: Step = {
      id: tempId,
      name: stepName.trim(),
      status: 'todo',
      assignee_id: undefined,
      description: '',
      start_date: undefined,
      target_date: undefined,
      completed_date: undefined,
      weight: 1,
      order_index: steps.length + 1,
      comments: '',
      subtasks: [],
      progress_percent: 0
    };
    setSteps((prev) => [...prev, optimisticStep]);
    setStepName('');
    setSelectedStepId(tempId);

    const persist = async () => {
      try {
        const created = await createStep({
          project_id: project.id,
          name: optimisticStep.name,
          status: optimisticStep.status,
          order_index: optimisticStep.order_index,
          weight: optimisticStep.weight,
          comments: optimisticStep.comments
        });
        setSteps((prev) =>
          prev.map((s) => (s.id === tempId ? { ...created, subtasks: created.subtasks ?? [] } : s))
        );
        setSelectedStepId(created.id);
        setActionTone('info');
        setActionMessage('Шаг сохранён через API.');
        notifyMetrics();
      } catch (err) {
        setActionTone('warning');
        setActionMessage('API шагов недоступно, шаг добавлен локально.');
      }
    };

    persist();
  };

  const handleStepDialogSave = async (payload: Parameters<typeof createStep>[0]) => {
    if (editingStep) {
      const updated = await updateStep(editingStep.id, payload);
      setSteps((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      setSelectedStepId(updated.id);
      setActionMessage('Шаг обновлён.');
      setActionTone('info');
      notifyMetrics();
    } else {
      const created = await createStep(payload);
      setSteps((prev) => [...prev, created]);
      setSelectedStepId(created.id);
      setActionMessage('Шаг создан.');
      setActionTone('info');
      notifyMetrics();
    }
  };

  const handleDeleteStep = () => {
    if (!selectedStepId) return;
    const target = steps.find((s) => s.id === selectedStepId);
    if (!target) return;
    setSteps((prev) => {
      const filtered = prev.filter((s) => s.id !== selectedStepId);
      return filtered.map((s, idx) => ({ ...s, order_index: idx + 1 }));
    });
    setSelectedStepId((prev) => {
      if (prev !== selectedStepId && prev !== null) return prev;
      const remaining = steps.filter((s) => s.id !== selectedStepId);
      return remaining[0]?.id ?? null;
    });
    setSubtasks([]);

    const persist = async () => {
      try {
        await deleteStep(target.id);
        setActionTone('info');
        setActionMessage('Шаг удалён через API.');
        notifyMetrics();
      } catch (err) {
        setActionTone('warning');
        setActionMessage('API шагов недоступно, удаление выполнено только локально.');
      }
    };

    persist();
  };

  const handleAddSubtask = () => {
    if (!selectedStep) return;
    const title = prompt('Название подзадачи');
    if (!title) return;
    const tempId = Date.now() * -1;
    setSubtasks((prev) => {
      const maxId = prev.reduce((acc, st) => Math.max(acc, st.id), 0);
      return [
        ...prev,
        {
          id: tempId || maxId + 1,
          name: title,
          status: 'todo',
          weight: 1,
          order_index: prev.length + 1,
          comment: '',
          completed_date: undefined,
          target_date: undefined,
          assignee_id: undefined
        }
      ];
    });
    setSelectedSubtaskId(tempId);

    const persist = async () => {
      try {
        const created = await createSubtask({
          step_id: selectedStep.id,
          name: title,
          status: 'todo',
          assignee_id: undefined,
          order_index: subtasks.length + 1,
          weight: 1,
          comment: ''
        });
        setSubtasks((prev) => prev.map((st) => (st.id === tempId ? { ...st, ...created } : st)));
        setSelectedSubtaskId(created.id);
        setActionTone('info');
        setActionMessage('Подзадача сохранена через API.');
        notifyMetrics();
      } catch (err) {
        setActionTone('warning');
        setActionMessage('API подзадач недоступно, подзадача добавлена локально.');
      }
    };

    persist();
  };

  const handleDeleteSubtask = () => {
    const selected =
      subtasks.find((st) => st.id === selectedSubtaskId) ?? filteredSubtasks[0];
    if (!selected) return;
    setSubtasks((prev) => prev.filter((st) => st.id !== selected.id));
    setSelectedSubtaskId((prev) => {
      if (prev !== selected.id && prev !== null) return prev;
      const remaining = subtasks.filter((st) => st.id !== selected.id);
      return remaining[0]?.id ?? null;
    });

    const persist = async () => {
      try {
        await deleteSubtask(selected.id);
        setActionTone('info');
        setActionMessage('Подзадача удалена через API.');
        notifyMetrics();
      } catch (err) {
        setActionTone('warning');
        setActionMessage('API подзадач недоступно, удаление выполнено локально.');
      }
    };

    persist();
  };

  const handleUpdateSubtask = () => {
    if (!selectedSubtask) return;
    const payload = {
      name: subtaskName,
      status: subtaskStatus,
      assignee_id: subtaskAssignee === 'unassigned' ? undefined : subtaskAssignee,
      target_date: subtaskTargetDate || undefined,
      completed_date: subtaskCompletedDate || undefined,
      weight:
        subtaskWeight !== '' && Number.isFinite(Number(subtaskWeight))
          ? Number(subtaskWeight)
          : 1,
      comment: subtaskComment
    };
    setSubtasks((prev) => prev.map((st) => (st.id === selectedSubtask.id ? { ...st, ...payload } : st)));

    const persist = async () => {
      try {
        const updated = await updateSubtask(selectedSubtask.id, payload);
        setSubtasks((prev) => prev.map((st) => (st.id === updated.id ? { ...st, ...updated } : st)));
        setActionTone('info');
        setActionMessage('Подзадача сохранена через API.');
        notifyMetrics();
      } catch (err) {
        setActionTone('warning');
        setActionMessage('API подзадач недоступно, изменения сохранены локально.');
      }
    };

    persist();
  };

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
              handleAddStep();
            }
          }}
        />
        <button className="menu-button" disabled={!stepName.trim()} onClick={handleAddStep}>
          Добавить шаг
        </button>
        <button
          className="menu-button"
          onClick={() => {
            setEditingStep(null);
            setShowStepDialog(true);
          }}
        >
          Добавить через форму
        </button>
        <button className="menu-button" disabled={!selectedStepId} onClick={handleDeleteStep}>
          Удалить выбранное
        </button>
        <button
          className="menu-button"
          disabled={!selectedStepId}
          onClick={() => setShowStepAttachments(true)}
        >
          Вложения шага
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
      {actionMessage && (
        <div className={`info ${actionTone === 'warning' ? 'warning' : ''}`}>{actionMessage}</div>
      )}

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
        <div className="inline-actions">
          <button
            className="small-button"
            onClick={() => {
              if (!selectedStep) return;
              setEditingStep(selectedStep);
              setShowStepDialog(true);
            }}
            disabled={!selectedStep}
          >
            Редактировать шаг
          </button>
        </div>
      </div>

      {activeTab === 'subtasks' && (
        <div className="subtasks">
          <div className="subtask-toolbar">
            <div className="left">
              <button className="menu-button" disabled={!selectedStepId} onClick={handleAddSubtask}>
                Добавить подзадачу
              </button>
              <button className="menu-button" disabled={!selectedStepId} onClick={handleDeleteSubtask}>
                Удалить подзадачу
              </button>
            </div>
            <input
              className="input"
              placeholder="Поиск по подзадачам…"
              value={subtaskSearch}
              onChange={(e) => setSubtaskSearch(e.target.value)}
            />
            <select
              className="input select"
              value={subtaskStatusFilter}
              onChange={(e) => setSubtaskStatusFilter(e.target.value as Status | 'all')}
            >
              <option value="all">Все статусы</option>
              <option value="todo">Не начато</option>
              <option value="in_progress">В работе</option>
              <option value="blocked">Заблокировано</option>
              <option value="done">Завершено</option>
            </select>
          </div>
          {loadingSubtasks && <div className="info">Загрузка подзадач…</div>}
          {subtaskError && <div className="info warning">{subtaskError}</div>}
          <div className="subtask-table">
            <div className="subtask-head">
              <span>ID</span>
              <span>Название</span>
              <span>Статус</span>
              <span>Исполнитель</span>
              <span>Целевая дата</span>
              <span>Дата завершения</span>
              <span>Вес</span>
              <span>Комментарий</span>
            </div>
            <div className="subtask-body">
              {filteredSubtasks.map((st: Subtask) => (
                <div
                  key={st.id}
                  className={`subtask-row status-${st.status} ${selectedSubtaskId === st.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSubtaskId(st.id)}
                >
                  <span>{st.id}</span>
                  <span className="ellipsis" title={st.name}>
                    {st.name}
                  </span>
                  <span className={`status ${st.status}`}>{statusLabel[st.status]}</span>
                  <span>{pmName(st.assignee_id)}</span>
                  <span>{st.target_date ?? '—'}</span>
                  <span>{st.completed_date ?? '—'}</span>
                  <span>{st.weight}</span>
                  <span className="ellipsis" title={st.comment}>
                    {st.comment || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {selectedSubtask && (
            <div className="subtask-editor">
              <div className="grid two-columns">
                <label>
                  Название
                  <input
                    className="input"
                    value={subtaskName}
                    onChange={(e) => setSubtaskName(e.target.value)}
                  />
                </label>
                <label>
                  Статус
                  <select
                    className="input select"
                    value={subtaskStatus}
                    onChange={(e) => setSubtaskStatus(e.target.value as Status)}
                  >
                    <option value="todo">Не начато</option>
                    <option value="in_progress">В работе</option>
                    <option value="blocked">Заблокировано</option>
                    <option value="done">Завершено</option>
                  </select>
                </label>
              </div>
              <div className="grid two-columns">
                <label>
                  Исполнитель
                  <select
                    className="input select"
                    value={subtaskAssignee}
                    onChange={(e) =>
                      setSubtaskAssignee(
                        e.target.value === 'unassigned' ? 'unassigned' : Number(e.target.value)
                      )
                    }
                  >
                    <option value="unassigned">Не указан</option>
                    {pmDirectory.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {pm.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Целевая дата
                  <input
                    type="date"
                    className="input"
                    value={subtaskTargetDate}
                    onChange={(e) => setSubtaskTargetDate(e.target.value)}
                  />
                </label>
              </div>
              <div className="grid two-columns">
                <label>
                  Дата завершения
                  <input
                    type="date"
                    className="input"
                    value={subtaskCompletedDate}
                    onChange={(e) => setSubtaskCompletedDate(e.target.value)}
                  />
                </label>
                <label>
                  Вес
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={subtaskWeight}
                    onChange={(e) => setSubtaskWeight(e.target.value)}
                  />
                </label>
              </div>
              <label>
                Комментарий
                <textarea
                  className="textarea"
                  value={subtaskComment}
                  onChange={(e) => setSubtaskComment(e.target.value)}
                />
              </label>
              <div className="actions align-end">
                <button className="menu-button" onClick={handleUpdateSubtask} disabled={!subtaskName}>
                  Сохранить подзадачу
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'details' && selectedStep && (
        <div className="details-tab">
          <label htmlFor="step-comments">Комментарий по шагу</label>
          <textarea
            id="step-comments"
            className="textarea"
            value={stepComments}
            onChange={(e) => setStepComments(e.target.value)}
          />
          <button
            className="menu-button align-end"
            onClick={() => {
              if (!selectedStepId) return;
              setSteps((prev) =>
                prev.map((s) =>
                  s.id === selectedStepId ? { ...s, comments: stepComments } : s
                )
              );

              const persist = async () => {
                try {
                  await updateStep(selectedStepId, { comments: stepComments });
                  setActionTone('info');
                  setActionMessage('Комментарий сохранён через API.');
                } catch (err) {
                  setActionTone('warning');
                  setActionMessage('API шагов недоступно, комментарий сохранён локально.');
                }
              };

              persist();
            }}
          >
            Сохранить
          </button>
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
          {filteredSteps
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
      {showStepAttachments && selectedStep && (
        <AttachmentModal
          stepId={selectedStep.id}
          stepName={selectedStep.name}
          projectName={project.name}
          workspacePath={workspacePath}
          onClose={() => setShowStepAttachments(false)}
        />
      )}
      {showStepDialog && (
        <StepDialog
          initial={editingStep ?? undefined}
          pms={pmDirectory}
          onSave={async (payload) =>
            handleStepDialogSave({
              project_id: project.id,
              ...payload
            })
          }
          onDelete={
            editingStep
              ? async () => {
                  await deleteStep(editingStep.id);
                  setSteps((prev) => prev.filter((s) => s.id !== editingStep.id));
                  setSelectedStepId(null);
                  setActionMessage('Шаг удалён.');
                  setActionTone('warning');
                }
              : undefined
          }
          onClose={() => {
            setShowStepDialog(false);
            setEditingStep(null);
          }}
        />
      )}
    </section>
  );
};

export default StepsPanel;
