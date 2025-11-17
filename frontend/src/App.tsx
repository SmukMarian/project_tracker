import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  createCategory,
  createProject,
  deleteCategory,
  deleteProject,
  fetchCategories,
  fetchKpi,
  fetchPMs,
  fetchProjects,
  fetchWorkspace,
  setWorkspace,
  updateCategory,
  updateProject,
  uploadAttachment,
  uploadProjectCover
} from './api';
import LeftPanel from './components/LeftPanel';
import PmDirectory from './components/PmDirectory';
import ProjectCard from './components/ProjectCard';
import StepsPanel from './components/StepsPanel';
import TopMenu from './components/TopMenu';
import KpiModal from './components/KpiModal';
import CategoryDialog from './components/CategoryDialog';
import ProjectDialog from './components/ProjectDialog';
import AttachmentModal from './components/AttachmentModal';
import { categories as seedCategories, pms as seedPMs } from './data';
import { Category, KpiReport, Project } from './types';
import { parseTokens } from './search';
import { LayoutProvider } from './layoutContext';

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
  const mainRef = useRef<HTMLElement | null>(null);
  const projectFilterRef = useRef<HTMLInputElement | null>(null);
  const seedProjects = useMemo(
    () => seedCategories.flatMap((c) => c.projects.map((p) => ({ ...p, category_id: c.id }))),
    []
  );
  const sidebarWidth = 320;
  const [categories, setCategories] = useState<Category[]>(seedCategories);
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [pmDirectory, setPmDirectory] = useState(seedPMs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPmDirectory, setShowPmDirectory] = useState(false);
  const [showKpi, setShowKpi] = useState(false);
  const [kpiData, setKpiData] = useState<KpiReport | null>(null);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showProjectMedia, setShowProjectMedia] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [layoutProbe, setLayoutProbe] = useState({ mainWidth: 0 });

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
  }, [error, pmDirectory, projectFilter, refreshKey, selectedCategoryId, seedProjects]);

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

  useEffect(() => {
    const node = mainRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setLayoutProbe((prev) =>
        prev.mainWidth === Math.round(width) ? prev : { ...prev, mainWidth: Math.round(width) }
      );
    });

    observer.observe(node);
    return () => observer.disconnect();
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

  const refreshMetrics = () => setRefreshKey((prev) => prev + 1);

  useEffect(() => {
    let isMounted = true;
    const loadKpi = async () => {
      setKpiLoading(true);
      try {
        const data = await fetchKpi(selectedCategoryId ?? undefined);
        if (!isMounted) return;
        setKpiData(data);
      } catch (err) {
        if (!isMounted) return;
        setKpiData(null);
      } finally {
        if (!isMounted) return;
        setKpiLoading(false);
      }
    };
    loadKpi();
    return () => {
      isMounted = false;
    };
  }, [selectedCategoryId, refreshKey]);

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

  const handleSaveCategory = async (payload: { name: string }) => {
    if (editingCategory) {
      const updated = await updateCategory(editingCategory.id, payload);
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? { ...c, name: updated.name } : c))
      );
      setInfo('Категория обновлена.');
    } else {
      const created = await createCategory(payload);
      setCategories((prev) => [...prev, { ...created, projects: [] }]);
      setSelectedCategoryId(created.id);
      setInfo('Категория создана.');
    }
    setError(null);
    refreshMetrics();
  };

  const handleDeleteCategory = async () => {
    if (!editingCategory) return;
    await deleteCategory(editingCategory.id);
    setCategories((prev) => prev.filter((c) => c.id !== editingCategory.id));
    setProjects((prev) => prev.filter((p) => p.category_id !== editingCategory.id));
    setSelectedCategoryId(null);
    setSelectedProjectId(null);
    setInfo('Категория удалена.');
    refreshMetrics();
  };

  const handleSaveProject = async (
    payload: Parameters<typeof createProject>[0] & { coverFile?: File | null; attachments?: File[] }
  ) => {
    const { coverFile, attachments, ...projectPayload } = payload;
    let project: Project;
    if (editingProject) {
      project = await updateProject(editingProject.id, projectPayload);
      setInfo('Проект обновлён.');
    } else {
      project = await createProject(projectPayload);
      setInfo('Проект создан.');
    }

    if (coverFile) {
      project = await uploadProjectCover(project.id, coverFile);
    }

    if (attachments && attachments.length > 0) {
      const uploaded = await Promise.all(
        attachments.map((file) => uploadAttachment({ project_id: project.id, file }))
      );
      project = { ...project, attachments: [...(project.attachments ?? []), ...uploaded] };
    }

    setProjects((prev) => {
      const exists = prev.find((p) => p.id === project.id);
      if (exists) {
        return prev.map((p) => (p.id === project.id ? { ...p, ...project } : p));
      }
      return [...prev, { ...project, steps: project.steps ?? [] }];
    });
    setSelectedProjectId(project.id);
    setSelectedCategoryId(project.category_id ?? null);
    setError(null);
    refreshMetrics();
  };

  const handleDeleteProject = async () => {
    if (!editingProject) return;
    await deleteProject(editingProject.id);
    setProjects((prev) => prev.filter((p) => p.id !== editingProject.id));
    setSelectedProjectId(null);
    setInfo('Проект удалён.');
    refreshMetrics();
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

  const openCategoryDialog = (category: Category | null) => {
    setEditingCategory((category ?? null) as unknown as Category);
    setShowCategoryDialog(true);
  };

  const openProjectDialog = (project: Project | null) => {
    setEditingProject((project ?? null) as unknown as Project);
    setShowProjectDialog(true);
  };

  return (
    <LayoutProvider
      value={{
        collapsed,
        sidebarWidth,
        testProbe: layoutProbe,
        setCollapsed,
        setTestProbe: setLayoutProbe
      }}
    >
      <div className="app">
        <TopMenu
          onToggleSidebar={() => setCollapsed((v) => !v)}
          onNewCategory={() => openCategoryDialog(null)}
          onNewProject={() => openProjectDialog(null)}
          onWorkspace={handleWorkspace}
          onExportCategories={handleExportCategories}
          onOpenPmDirectory={() => setShowPmDirectory(true)}
          onOpenKpi={handleOpenKpi}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
        />

        <div
          className={`layout ${collapsed ? 'layout--collapsed' : ''}`}
          style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
        >
          <div className="sidebar-shell">
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
              onEditCategory={openCategoryDialog}
              onDeleteCategory={(category) => {
                setEditingCategory(category as unknown as Category);
                setShowCategoryDialog(true);
              }}
              onEditProject={openProjectDialog}
              onDeleteProject={(project) => {
                setEditingProject(project as unknown as Project);
                setShowProjectDialog(true);
              }}
              kpiData={kpiData}
              kpiLoading={kpiLoading}
              onRefreshKpi={refreshMetrics}
            />
          </div>

          <main className="main" ref={mainRef}>
            {loading && <div className="info">Загрузка данных…</div>}
            {info && <div className="info success">{info}</div>}
            {error && <div className="info warning">{error}</div>}
            {selectedProject ? (
              <>
                <ProjectCard
                  project={selectedProject}
                  pmDirectory={pmDirectory}
                  workspacePath={workspacePath}
                  onExportWord={handleExportWord}
                  onExportPresentation={handleExportPresentation}
                  onEdit={() => openProjectDialog(selectedProject)}
                  onOpenMedia={() => setShowProjectMedia(true)}
                />
                <StepsPanel
                  project={selectedProject}
                  pmDirectory={pmDirectory}
                  workspacePath={workspacePath}
                  onMetricsChanged={refreshMetrics}
                />
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
        {showCategoryDialog && (
          <CategoryDialog
            initial={editingCategory}
            onSave={handleSaveCategory}
            onDelete={editingCategory ? handleDeleteCategory : undefined}
            onClose={() => {
              setShowCategoryDialog(false);
              setEditingCategory(null);
            }}
          />
        )}
        {showProjectDialog && (
          <ProjectDialog
            categories={categories}
            pms={pmDirectory}
            initial={editingProject}
            defaultCategoryId={selectedCategoryId ?? undefined}
            onSave={handleSaveProject}
            onDelete={editingProject ? handleDeleteProject : undefined}
            onClose={() => {
              setShowProjectDialog(false);
              setEditingProject(null);
            }}
          />
        )}
        {showProjectMedia && selectedProject && (
          <AttachmentModal
            projectId={selectedProject.id}
            projectName={selectedProject.name}
            workspacePath={workspacePath}
            onClose={() => setShowProjectMedia(false)}
          />
        )}
      </div>
    </LayoutProvider>
  );
};

export default App;
