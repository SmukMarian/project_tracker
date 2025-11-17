import React, { useMemo, useState } from 'react';
import { Category, PM, Project, ProjectStatus } from '../types';

interface Props {
  categories: Category[];
  pms: PM[];
  initial?: Project | null;
  defaultCategoryId?: number;
  onSave: (payload: {
    category_id: number;
    name: string;
    code?: string;
    status?: ProjectStatus;
    owner_id?: number;
    start_date?: string;
    target_date?: string;
    description?: string;
    moq?: number;
    base_price?: number;
    retail_price?: number;
    inprogress_coeff?: number;
    coverFile?: File | null;
    attachments?: File[];
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

const ProjectDialog: React.FC<Props> = ({
  categories,
  pms,
  initial,
  defaultCategoryId,
  onSave,
  onDelete,
  onClose
}) => {
  const [form, setForm] = useState({
    category_id: initial?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? 0,
    name: initial?.name ?? '',
    code: initial?.code ?? '',
    status: initial?.status ?? 'active',
    owner_id: initial?.owner_id ?? undefined,
    start_date: initial?.start_date ?? '',
    target_date: initial?.target_date ?? '',
    description: initial?.description ?? '',
    moq: initial?.moq?.toString() ?? '',
    base_price: initial?.base_price?.toString() ?? '',
    retail_price: initial?.retail_price?.toString() ?? '',
    inprogress_coeff: initial?.inprogress_coeff?.toString() ?? ''
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(initial?.cover_image ?? null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoriesOptions = useMemo(() => categories.map((c) => ({ label: c.name, value: c.id })), [categories]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Название обязательно.');
      return;
    }
    if (!form.category_id) {
      setError('Нужно выбрать категорию.');
      return;
    }
    setLoading(true);
    try {
      await onSave({
        category_id: Number(form.category_id),
        name: form.name.trim(),
        code: form.code || undefined,
        status: form.status as ProjectStatus,
        owner_id: form.owner_id ? Number(form.owner_id) : undefined,
        start_date: form.start_date || undefined,
        target_date: form.target_date || undefined,
        description: form.description || undefined,
        moq: form.moq ? Number(form.moq) : undefined,
        base_price: form.base_price ? Number(form.base_price) : undefined,
        retail_price: form.retail_price ? Number(form.retail_price) : undefined,
        inprogress_coeff: form.inprogress_coeff ? Number(form.inprogress_coeff) : undefined,
        coverFile,
        attachments
      });
      onClose();
    } catch (err) {
      setError('Не удалось сохранить проект.');
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
      setError('Не удалось удалить проект.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal large">
        <div className="modal-header">
          <h3>{initial ? 'Редактирование проекта' : 'Новый проект'}</h3>
          <button className="icon-button" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>
        <form className="modal-form grid" onSubmit={handleSubmit}>
          <label>
            Категория
            <select value={form.category_id} onChange={(e) => handleChange('category_id', e.target.value)}>
              {categoriesOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Название
            <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Название проекта" />
          </label>
          <label>
            Код
            <input value={form.code} onChange={(e) => handleChange('code', e.target.value)} placeholder="Код/артикул" />
          </label>
          <label>
            Статус
            <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label>
            PM
            <select value={form.owner_id ?? ''} onChange={(e) => handleChange('owner_id', e.target.value)}>
              <option value="">—</option>
              {pms.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Дата старта
            <input type="date" value={form.start_date} onChange={(e) => handleChange('start_date', e.target.value)} />
          </label>
          <label>
            Целевая дата
            <input type="date" value={form.target_date} onChange={(e) => handleChange('target_date', e.target.value)} />
          </label>
          <label className="span-2">
            Описание
            <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={3} />
          </label>
          <label>
            MOQ
            <input type="number" value={form.moq} onChange={(e) => handleChange('moq', e.target.value)} />
          </label>
          <label>
            Базовая цена
            <input type="number" value={form.base_price} onChange={(e) => handleChange('base_price', e.target.value)} />
          </label>
          <label>
            Розничная цена
            <input type="number" value={form.retail_price} onChange={(e) => handleChange('retail_price', e.target.value)} />
          </label>
          <label>
            Коэффициент in-progress
            <input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={form.inprogress_coeff}
              onChange={(e) => handleChange('inprogress_coeff', e.target.value)}
            />
          </label>
          <label>
            Обложка
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setCoverFile(file);
                if (file) {
                  setCoverPreview(URL.createObjectURL(file));
                }
              }}
            />
            {coverPreview && (
              <div className="cover-preview">
                <img src={coverPreview} alt="Превью обложки" />
              </div>
            )}
          </label>
          <label className="span-2">
            Вложения
            <input
              type="file"
              multiple
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : [];
                setAttachments(files);
              }}
            />
            {attachments.length > 0 && (
              <ul className="attachment-preview">
                {attachments.map((file) => (
                  <li key={file.name}>{file.name}</li>
                ))}
              </ul>
            )}
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

export default ProjectDialog;
