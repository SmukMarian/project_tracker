import React, { useMemo, useState } from 'react';
import LeftPanel from './components/LeftPanel';
import ProjectCard from './components/ProjectCard';
import StepsPanel from './components/StepsPanel';
import TopMenu from './components/TopMenu';
import { categories as seedCategories, pms } from './data';
import { Category, Project } from './types';

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(seedCategories[0]?.id ?? null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    seedCategories[0]?.projects[0]?.id ?? null
  );
  const [workspacePath] = useState('C:/Workspace/HaierTracker');

  const categories: Category[] = useMemo(() => seedCategories, []);

  const selectedProject: Project | null = useMemo(() => {
    const category = categories.find((c) => c.id === selectedCategoryId);
    return category?.projects.find((p) => p.id === selectedProjectId) ?? null;
  }, [categories, selectedCategoryId, selectedProjectId]);

  const handleSelectProject = (categoryId: number, projectId: number) => {
    setSelectedCategoryId(categoryId);
    setSelectedProjectId(projectId);
  };

  return (
    <div className="app">
      <TopMenu
        onToggleSidebar={() => setCollapsed((v) => !v)}
        onNewCategory={() => alert('Диалог создания категории (заглушка).')}
        onNewProject={() => alert('Диалог создания проекта (заглушка).')}
      />

      <div className="layout">
        {!collapsed && (
          <LeftPanel
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            selectedProjectId={selectedProjectId}
            onSelectCategory={setSelectedCategoryId}
            onSelectProject={handleSelectProject}
            categoryFilter={categoryFilter}
            projectFilter={projectFilter}
            onCategoryFilter={setCategoryFilter}
            onProjectFilter={setProjectFilter}
            workspacePath={workspacePath}
          />
        )}

        <main className="main">
          {selectedProject ? (
            <>
              <ProjectCard project={selectedProject} pmDirectory={pms} />
              <StepsPanel project={selectedProject} pmDirectory={pms} />
            </>
          ) : (
            <div className="empty">Выберите проект слева, чтобы увидеть детали.</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
