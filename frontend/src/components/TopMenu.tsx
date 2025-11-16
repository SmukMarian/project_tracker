import React from 'react';

interface Props {
  onToggleSidebar: () => void;
  onNewCategory: () => void;
  onNewProject: () => void;
}

const TopMenu: React.FC<Props> = ({ onToggleSidebar, onNewCategory, onNewProject }) => {
  return (
    <header className="top-menu">
      <div className="menu-group">
        <button className="menu-button">Workspace</button>
        <button className="menu-button" onClick={onNewCategory}>
          Новая категория
        </button>
        <button className="menu-button" onClick={onNewProject}>
          Новый проект
        </button>
        <button className="menu-button">Экспорт категорий (Excel)</button>
        <button className="menu-button">KPI</button>
        <button className="menu-button">Справочник PM</button>
      </div>
      <div className="menu-actions">
        <button className="menu-button" onClick={onToggleSidebar}>
          Свернуть/развернуть левую панель
        </button>
      </div>
    </header>
  );
};

export default TopMenu;
