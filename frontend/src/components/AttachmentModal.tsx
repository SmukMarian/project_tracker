import React, { useEffect, useState } from 'react';
import {
  deleteAttachment,
  fetchProjectAttachments,
  fetchStepAttachments,
  uploadAttachment
} from '../api';
import { Attachment } from '../types';

interface Props {
  projectId?: number;
  stepId?: number;
  projectName?: string;
  stepName?: string;
  workspacePath?: string;
  onClose: () => void;
}

const AttachmentModal: React.FC<Props> = ({
  projectId,
  stepId,
  projectName,
  stepName,
  workspacePath,
  onClose
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const targetLabel = stepName ? `Шаг: ${stepName}` : projectName ? `Проект: ${projectName}` : 'Вложения';

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = stepId
          ? await fetchStepAttachments(stepId)
          : projectId
          ? await fetchProjectAttachments(projectId)
          : [];
        if (!isMounted) return;
        setAttachments(data);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError('Не удалось загрузить вложения.');
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [projectId, stepId]);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const created = await uploadAttachment({ project_id: projectId, step_id: stepId, file });
      setAttachments((prev) => [...prev, created]);
      setInfo('Файл сохранён в workspace.');
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить файл.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAttachment(id);
      setAttachments((prev) => prev.filter((a) => a.id !== id));
      setInfo('Вложение удалено.');
      setError(null);
    } catch (err) {
      setError('Не удалось удалить вложение.');
    }
  };

  const resolvePath = (path: string) => {
    if (!workspacePath) return path;
    return `${workspacePath.replace(/\\$/, '')}/${path}`;
  };

  return (
    <div className="modal-backdrop">
      <div className="modal attachments-modal">
        <header className="modal-header">
          <h3>Медиатека / вложения</h3>
          <span className="target-label">{targetLabel}</span>
        </header>
        <div className="modal-body">
          {info && <div className="info success">{info}</div>}
          {error && <div className="info warning">{error}</div>}
          <div className="upload-row">
            <label className="menu-button file-input-label">
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
                disabled={uploading}
              />
              {uploading ? 'Загрузка…' : 'Добавить файл'}
            </label>
            {workspacePath && <span className="workspace-hint">Корень workspace: {workspacePath}</span>}
          </div>
          <div className="attachment-list">
            <div className="attachment-head">
              <span>Путь</span>
              <span>Добавлено</span>
              <span>Действия</span>
            </div>
            <div className="attachment-body">
              {attachments.length === 0 && <div className="empty">Пока нет вложений.</div>}
              {attachments.map((att) => (
                <div key={att.id} className="attachment-row">
                  <span className="ellipsis" title={resolvePath(att.path)}>
                    {att.path}
                  </span>
                  <span>{att.added_at ?? '—'}</span>
                  <div className="actions">
                    <a
                      href={workspacePath ? `file://${resolvePath(att.path)}` : '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="menu-button ghost"
                    >
                      Открыть
                    </a>
                    <button className="menu-button danger" onClick={() => handleDelete(att.id)}>
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <footer className="modal-footer">
          <button className="menu-button" onClick={onClose}>
            Закрыть
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AttachmentModal;
