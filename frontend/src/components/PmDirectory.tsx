import React from 'react';
import { PM } from '../types';

interface Props {
  pms: PM[];
  onClose: () => void;
}

const PmDirectory: React.FC<Props> = ({ pms, onClose }) => {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h3>Справочник PM</h3>
          <button className="icon-button" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>
        <p className="modal-subtitle">Добавление/изменение пока не реализованы (заглушка).</p>
        <div className="modal-table pm-table">
          <div className="modal-row modal-head">
            <span>ID</span>
            <span>Имя</span>
          </div>
          <div className="modal-body">
            {pms.map((pm) => (
              <div key={pm.id} className="modal-row">
                <span>{pm.id}</span>
                <span className="ellipsis" title={pm.name}>
                  {pm.name}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="menu-button" disabled>
            Добавить
          </button>
          <button className="menu-button" disabled>
            Изменить
          </button>
          <button className="menu-button" disabled>
            Удалить
          </button>
          <button className="menu-button" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default PmDirectory;
