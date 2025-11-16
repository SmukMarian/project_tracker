import React, { useEffect, useMemo, useState } from 'react';
import { fetchCategories, fetchPMs, fetchWorkspace } from './api';
import LeftPanel from './components/LeftPanel';
import ProjectCard from './components/ProjectCard';
import StepsPanel from './components/StepsPanel';
import TopMenu from './components/TopMenu';
import { categories as seedCategories, pms as seedPMs } from './data';
import { Project } from './types';

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [workspacePath, setWorkspacePath] = useState('');
  const [categories, setCategories] = useState<Category[]>(seedCategories);
  const [pmDirectory, setPmDirectory] = useState(seedPMs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [workspace, pms, fetchedCategories] = await Promise.all([
          fetchWorkspace(),
          fetchPMs(),
          fetchCategories()
        ]);
        if (!isMounted) return;
        setWorkspacePath(workspace?.path ?? '');
        setPmDirectory(pms.length ? pms : seedPMs);
        setCategories(fetchedCategories.length ? fetchedCategories : seedCategories);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError('API недоступно, показаны мок-данные.');
        setPmDirectory(seedPMs);
        setCategories(seedCategories);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!categories.length) return;
    const firstCategory = categories[0];
    const firstProject = firstCategory.projects[0];
    setSelectedCategoryId((prev) => (prev !== null ? prev : firstCategory.id));
    if (firstProject) {
      setSelectedProjectId((prev) => (prev !== null ? prev : firstProject.id));
    }
  }, [categories]);

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
          {loading && <div className="info">Загрузка данных…</div>}
          {error && <div className="info warning">{error}</div>}
          {selectedProject ? (
            <>
              <ProjectCard project={selectedProject} pmDirectory={pmDirectory} />
              <StepsPanel project={selectedProject} pmDirectory={pmDirectory} />
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
