import React, { useState } from 'react';
import { Category } from '../types';

interface Props {
  initial?: Category | null;
  onSave: (payload: { name: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

const CategoryDialog: React.FC<Props> = ({ initial, onSave, onDelete, onClose }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Название обязательно.');
      return;
    }
    setLoading(true);
    try {
      await onSave({ name: name.trim() });
      onClose();
    } catch (err) {
      setError('Не удалось сохранить категорию.');
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
      setError('Не удалось удалить категорию.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h3>{initial ? 'Редактирование категории' : 'Новая категория'}</h3>
          <button className="icon-button" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Название
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Введите название" />
          </label>
          {error && <div className="info warning">{error}</div>}
          <div className="modal-actions">
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

export default CategoryDialog;
