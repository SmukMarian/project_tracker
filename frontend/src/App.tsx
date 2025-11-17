import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchCategories, fetchKpi, fetchPMs, fetchProjects, fetchWorkspace, setWorkspace } from './api';
import LeftPanel from './components/LeftPanel';
import PmDirectory from './components/PmDirectory';
import ProjectCard from './components/ProjectCard';
import StepsPanel from './components/StepsPanel';
import TopMenu from './components/TopMenu';
import KpiModal from './components/KpiModal';
import { categories as seedCategories, pms as seedPMs } from './data';
import { Category, KpiReport, Project } from './types';
import { parseTokens } from './search';

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [workspacePath, setWorkspacePath] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage.getItem('theme');
    return stored === 'dark' ? 'dark' : 'light';
  });
  const projectFilterRef = useRef<HTMLInputElement | null>(null);
  const seedProjects = useMemo(
    () => seedCategories.flatMap((c) => c.projects.map((p) => ({ ...p, category_id: c.id }))),
    []
  );

  const [categories, setCategories] = useState<Category[]>(seedCategories);
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [pmDirectory, setPmDirectory] = useState(seedPMs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPmDirectory, setShowPmDirectory] = useState(false);
  const [showKpi, setShowKpi] = useState(false);
  const [kpiData, setKpiData] = useState<KpiReport | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [workspace, pms, fetchedCategories, fetchedProjects] = await Promise.all([
          fetchWorkspace(),
          fetchPMs(),
          fetchCategories(),
          fetchProjects({})
        ]);
        if (!isMounted) return;
        setWorkspacePath(workspace?.path ?? '');
        setPmDirectory(pms.length ? pms : seedPMs);
        setCategories(fetchedCategories.length ? fetchedCategories : seedCategories);
        setProjects(fetchedProjects.length ? fetchedProjects : seedProjects);
        setError(null);
        setInfo(null);
      } catch (err) {
        if (!isMounted) return;
        setError('API недоступно, показаны мок-данные.');
        setPmDirectory(seedPMs);
        setCategories(seedCategories);
        setProjects(seedProjects);
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
    if (error) return;
    let isMounted = true;
    const loadProjects = async () => {
      const parsed = parseTokens(projectFilter);
      const ownerId = pmDirectory.find((pm) => pm.name.toLowerCase() === parsed.owner?.toLowerCase())?.id;
      try {
        const fetched = await fetchProjects({
          category_id: selectedCategoryId ?? undefined,
          owner_id: ownerId,
          status: parsed.status,
          search: parsed.text || undefined
        });
        if (!isMounted) return;
        setProjects(fetched.length ? fetched : seedProjects);
      } catch (err) {
        if (!isMounted) return;
        setError('API недоступно, показаны мок-данные.');
        setProjects(seedProjects);
      }
    };
    loadProjects();
    return () => {
      isMounted = false;
    };
  }, [error, pmDirectory, projectFilter, selectedCategoryId, seedProjects]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        projectFilterRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const categoriesWithProjects = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      projects: projects.filter((project) => project.category_id === category.id)
    }));
  }, [categories, projects]);

  useEffect(() => {
    if (!categoriesWithProjects.length) return;
    const firstCategory = categoriesWithProjects[0];
    const currentCategory = categoriesWithProjects.find((c) => c.id === selectedCategoryId);
    const categoryToUse = currentCategory ?? firstCategory;
    if (selectedCategoryId === null || categoryToUse.id !== selectedCategoryId) {
      setSelectedCategoryId(categoryToUse.id);
    }

    const firstProject = categoryToUse.projects[0];
    const hasCurrentProject = categoryToUse.projects.some((p) => p.id === selectedProjectId);
    if (!hasCurrentProject) {
      setSelectedProjectId(firstProject ? firstProject.id : null);
    }
  }, [categoriesWithProjects, selectedCategoryId, selectedProjectId]);

  const selectedProject: Project | null = useMemo(() => {
    const category = categoriesWithProjects.find((c) => c.id === selectedCategoryId);
    return category?.projects.find((p) => p.id === selectedProjectId) ?? null;
  }, [categoriesWithProjects, selectedCategoryId, selectedProjectId]);

  const handleSelectProject = (categoryId: number, projectId: number) => {
    setSelectedCategoryId(categoryId);
    setSelectedProjectId(projectId);
  };

  const handleWorkspace = async () => {
    const path = window.prompt('Введите путь к workspace', workspacePath);
    if (!path) return;
    try {
      const updated = await setWorkspace(path);
      setWorkspacePath(updated.path);
      setInfo('Workspace обновлён.');
      setError(null);
    } catch (err) {
      setError('Не удалось сохранить workspace.');
    }
  };

  const handleExportCategories = () => {
    window.open('http://localhost:8000/export/categories/excel', '_blank');
  };

  const handleExportWord = () => {
    const query = selectedCategoryId ? `?category_id=${selectedCategoryId}` : '';
    window.open(`http://localhost:8000/export/projects/word${query}`, '_blank');
  };

  const handleExportPresentation = () => {
    if (!selectedCategoryId) return;
    window.open(`http://localhost:8000/export/category/${selectedCategoryId}/presentation`, '_blank');
  };

  const handleOpenKpi = async () => {
    try {
      const data = await fetchKpi(selectedCategoryId ?? undefined);
      setKpiData(data);
      setShowKpi(true);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить KPI.');
    }
  };

  return (
    <div className="app">
      <TopMenu
        onToggleSidebar={() => setCollapsed((v) => !v)}
        onNewCategory={() => alert('Диалог создания категории (заглушка).')}
        onNewProject={() => alert('Диалог создания проекта (заглушка).')}
        onWorkspace={handleWorkspace}
        onExportCategories={handleExportCategories}
        onOpenPmDirectory={() => setShowPmDirectory(true)}
        onOpenKpi={handleOpenKpi}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
      />

      <div className="layout">
        {!collapsed && (
          <LeftPanel
            categories={categoriesWithProjects}
            selectedCategoryId={selectedCategoryId}
            selectedProjectId={selectedProjectId}
            onSelectCategory={setSelectedCategoryId}
            onSelectProject={handleSelectProject}
            categoryFilter={categoryFilter}
            projectFilter={projectFilter}
            onCategoryFilter={setCategoryFilter}
            onProjectFilter={setProjectFilter}
            workspacePath={workspacePath}
            projectFilterRef={projectFilterRef}
          />
        )}

        <main className="main">
          {loading && <div className="info">Загрузка данных…</div>}
          {info && <div className="info success">{info}</div>}
          {error && <div className="info warning">{error}</div>}
          {selectedProject ? (
            <>
              <ProjectCard
                project={selectedProject}
                pmDirectory={pmDirectory}
                onExportWord={handleExportWord}
                onExportPresentation={handleExportPresentation}
              />
              <StepsPanel project={selectedProject} pmDirectory={pmDirectory} />
            </>
          ) : (
            <div className="empty">Выберите проект слева, чтобы увидеть детали.</div>
          )}
        </main>
      </div>
      {showPmDirectory && (
        <PmDirectory pms={pmDirectory} onClose={() => setShowPmDirectory(false)} />
      )}
      {showKpi && kpiData && <KpiModal data={kpiData} onClose={() => setShowKpi(false)} />}
    </div>
  );
};

export default App;
