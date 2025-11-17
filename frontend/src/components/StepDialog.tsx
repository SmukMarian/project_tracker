import React, { useState } from 'react';
import { PM, Step, Status } from '../types';

interface Props {
  initial?: Step;
  pms: PM[];
  onSave: (payload: {
    name: string;
    description?: string;
    status?: Status;
    assignee_id?: number;
    start_date?: string;
    target_date?: string;
    completed_date?: string;
    weight?: number;
    comments?: string;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

const StepDialog: React.FC<Props> = ({ initial, pms, onSave, onDelete, onClose }) => {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    status: initial?.status ?? 'todo',
    assignee_id: initial?.assignee_id ?? undefined,
    start_date: initial?.start_date ?? '',
    target_date: initial?.target_date ?? '',
    completed_date: initial?.completed_date ?? '',
    weight: initial?.weight?.toString() ?? '',
    comments: initial?.comments ?? ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Название обязательно.');
      return;
    }
    setLoading(true);
    try {
      await onSave({
        name: form.name.trim(),
        description: form.description || undefined,
        status: form.status as Status,
        assignee_id: form.assignee_id ? Number(form.assignee_id) : undefined,
        start_date: form.start_date || undefined,
        target_date: form.target_date || undefined,
        completed_date: form.completed_date || undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        comments: form.comments || undefined
      });
      onClose();
    } catch (err) {
      setError('Не удалось сохранить шаг.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setLoading(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError('Не удалось удалить шаг.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal large">
        <div className="modal-header">
          <h3>{initial ? 'Редактирование шага' : 'Новый шаг'}</h3>
          <button className="icon-button" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>
        <form className="modal-form grid" onSubmit={handleSubmit}>
          <label className="span-2">
            Название
            <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Название шага" />
          </label>
          <label className="span-2">
            Описание
            <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={3} />
          </label>
          <label>
            Статус
            <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
              <option value="todo">Не начато</option>
              <option value="in_progress">В работе</option>
              <option value="blocked">Заблокировано</option>
              <option value="done">Завершено</option>
            </select>
          </label>
          <label>
            Исполнитель
            <select value={form.assignee_id ?? ''} onChange={(e) => handleChange('assignee_id', e.target.value)}>
              <option value="">—</option>
              {pms.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Дата начала
            <input type="date" value={form.start_date} onChange={(e) => handleChange('start_date', e.target.value)} />
          </label>
          <label>
            Целевая дата
            <input type="date" value={form.target_date} onChange={(e) => handleChange('target_date', e.target.value)} />
          </label>
          <label>
            Фактическая дата
            <input type="date" value={form.completed_date} onChange={(e) => handleChange('completed_date', e.target.value)} />
          </label>
          <label>
            Вес
            <input type="number" step="0.1" value={form.weight} onChange={(e) => handleChange('weight', e.target.value)} />
          </label>
          <label className="span-2">
            Комментарий
            <textarea value={form.comments} onChange={(e) => handleChange('comments', e.target.value)} rows={2} />
          </label>
          {error && <div className="info warning span-2">{error}</div>}
          <div className="modal-actions span-2">
            {onDelete && initial && (
              <button className="menu-button danger" type="button" onClick={handleDelete} disabled={loading}>
                Удалить
              </button>
            )}
            <div className="spacer" />
            <button className="menu-button ghost" type="button" onClick={onClose} disabled={loading}>
              Отмена
            </button>
            <button className="menu-button" type="submit" disabled={loading}>
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StepDialog;
