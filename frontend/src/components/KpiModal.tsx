import React from 'react';
import { KpiReport } from '../types';

interface Props {
  data: KpiReport;
  onClose: () => void;
}

const KpiModal: React.FC<Props> = ({ data, onClose }) => {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="title">KPI по проектам</div>
            <div className="modal-subtitle">Агрегированные показатели по выбранной категории</div>
          </div>
          <button className="menu-button" onClick={onClose}>
            Закрыть
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-row">
            <div className="modal-head">Проекты</div>
            <div className="modal-table">
              <div className="modal-row">
                <div>Всего</div>
                <div>{data.total_projects}</div>
              </div>
              <div className="modal-row">
                <div>Активные</div>
                <div>{data.active_projects}</div>
              </div>
              <div className="modal-row">
                <div>Архив</div>
                <div>{data.archived_projects}</div>
              </div>
              <div className="modal-row">
                <div>Средний прогресс</div>
                <div>{data.average_progress}%</div>
              </div>
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-head">Шаги</div>
            <div className="modal-table">
              <div className="modal-row">
                <div>Всего</div>
                <div>{data.steps_total}</div>
              </div>
              <div className="modal-row">
                <div>Завершено</div>
                <div>{data.steps_done}</div>
              </div>
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-head">Подзадачи</div>
            <div className="modal-table">
              <div className="modal-row">
                <div>Всего</div>
                <div>{data.subtasks_total}</div>
              </div>
              <div className="modal-row">
                <div>Завершено</div>
                <div>{data.subtasks_done}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KpiModal;
