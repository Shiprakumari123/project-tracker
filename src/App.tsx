import { useEffect, useRef, useState, useMemo } from 'react';
import { useTaskStore } from './store';
import { KanbanBoard } from './components/KanbanBoard';
import { ListView } from './components/ListView';
import { TimelineView } from './components/TimelineView';
import { LayoutDashboard, List, CalendarDays, Search, Check, Filter, X, Users, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import type { ViewMode, TaskStatus, TaskPriority } from './types';
import { applyFilters, getInitials } from './utils';

function useUrlSync() {
  const { filters, searchQuery, setFilters, setSearchQuery } = useTaskStore();
  const mounted = useRef(false);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setFilters({
        status: params.getAll('status') as TaskStatus[],
        priority: params.getAll('priority') as TaskPriority[],
        assignees: params.getAll('assignee'),
        dateStart: params.get('dateStart') || '',
        dateEnd: params.get('dateEnd') || '',
      });
      setSearchQuery(params.get('q') || '');
    };

    syncFromUrl();
    mounted.current = true;

    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [setFilters, setSearchQuery]);

  useEffect(() => {
    if (!mounted.current) return;

    const params = new URLSearchParams();
    filters.status.forEach(s => params.append('status', s));
    filters.priority.forEach(p => params.append('priority', p));
    filters.assignees.forEach(a => params.append('assignee', a));
    if (filters.dateStart) params.set('dateStart', filters.dateStart);
    if (filters.dateEnd) params.set('dateEnd', filters.dateEnd);
    if (searchQuery) params.set('q', searchQuery);

    const newQueryStr = params.toString();
    const currentQueryStr = window.location.search.replace(/^\?/, '');

    if (newQueryStr !== currentQueryStr) {
      const newUrl = `${window.location.pathname}${newQueryStr ? '?' + newQueryStr : ''}`;
      // Instant history push for native URL changes without setTimeout bugs!
      window.history.pushState({}, '', newUrl);
    }
  }, [filters, searchQuery]);
}

const MultiSelectDropdown = ({ title, options, selected, onChange, icon: Icon }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter((i: string) => i !== opt));
    else onChange([...selected, opt]);
  };

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Filter by ${title}`}
        className={clsx(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:border-indigo-400",
          selected.length > 0 
            ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-[inset_0_1px_4px_rgba(79,70,229,0.1)]" 
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
        )}
      >
        {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
        <span>{title}</span>
        {selected.length > 0 && (
          <span className="bg-indigo-700 text-white min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[11px] font-black tracking-tight" aria-label={`${selected.length} selected`}>
            {selected.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-xl p-2 z-50 min-w-[220px] max-h-64 overflow-y-auto flex flex-col gap-0.5 custom-scrollbar" role="listbox" aria-label={title}>
          {options.map((opt: string) => (
            <button 
              key={opt}
              type="button"
              role="option"
              aria-selected={selected.includes(opt)}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group w-full text-left focus:outline-none focus:bg-indigo-50"
              onClick={() => toggleOption(opt)}
            >
              <div className={clsx(
                "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-200",
                selected.includes(opt) ? "bg-indigo-700 border-indigo-700 shadow-inner" : "bg-white border-slate-300 group-hover:border-indigo-400"
              )} aria-hidden="true">
                {selected.includes(opt) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <span className="text-sm text-slate-700 font-semibold truncate select-none">{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DateRangeFilter = ({ dateStart, dateEnd, onChangeStart, onChangeEnd }: any) => {
  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-1.5 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-400 transition-all shrink-0">
      <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
      <label htmlFor="start-date-filter" className="sr-only">Start Date</label>
      <input 
        id="start-date-filter"
        type="date" 
        value={dateStart} 
        onChange={(e) => onChangeStart(e.target.value)}
        aria-label="Start Date Filter"
        className="text-sm text-slate-600 bg-transparent outline-none focus:text-indigo-700 font-semibold w-[120px] cursor-pointer"
        title="Start Date"
      />
      <span className="text-slate-300 font-black" aria-hidden="true">-</span>
      <label htmlFor="end-date-filter" className="sr-only">End Date</label>
      <input 
        id="end-date-filter"
        type="date" 
        value={dateEnd} 
        onChange={(e) => onChangeEnd(e.target.value)}
        aria-label="End Date Filter"
        className="text-sm text-slate-600 bg-transparent outline-none focus:text-indigo-700 font-semibold w-[120px] cursor-pointer"
        title="End Date"
      />
    </div>
  );
};

function App() {
  // Bind core state URL sync exactly directly
  useUrlSync();

  const [isInitialized, setIsInitialized] = useState(false);
  const { viewMode, setViewMode, tasks, searchQuery, setSearchQuery, filters, setFilters, clearFilters, collaborators, setCollaborators } = useTaskStore();

  useEffect(() => {
    // Explicitly guarantee tasks are formally mounted synchronously securely preventing NO_FCP blank frames
    if (tasks.length > 0) {
      setIsInitialized(true);
    }
  }, [tasks]);

  // Simulated Real-Time Collaboration Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const filteredTasks = applyFilters(tasks, searchQuery, filters);
      if (filteredTasks.length === 0) return;

      const collabs = useTaskStore.getState().collaborators;
      
      setCollaborators(
        collabs.map(c => {
          if (Math.random() < 0.4) {
            const randomTask = filteredTasks[Math.floor(Math.random() * Math.min(filteredTasks.length, 50))];
            return { ...c, activeTaskId: randomTask.id };
          }
          return c;
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [tasks, searchQuery, filters, setCollaborators]);

  const STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];
  const PRIORITIES: TaskPriority[] = ['Critical', 'Medium', 'Low'];
  
  // Extract unique assignees seamlessly dynamically across tasks matrix
  const uniqueAssignees = useMemo(() => Array.from(new Set(tasks.map(t => t.assignee))).sort(), [tasks]);

  const isFiltersActive = filters.status.length > 0 || filters.priority.length > 0 || filters.assignees.length > 0 || filters.dateStart !== '' || filters.dateEnd !== '' || searchQuery !== '';

  const renderView = () => {
    switch (viewMode) {
      case 'kanban':
        return <KanbanBoard />;
      case 'list':
        return <ListView />;
      case 'timeline':
        return <TimelineView />;
      default:
        return <KanbanBoard />;
    }
  };

  const NavButton = ({ mode, icon: Icon, label }: { mode: ViewMode; icon: any; label: string }) => (
    <button
      onClick={() => setViewMode(mode)}
      role="tab"
      aria-selected={viewMode === mode}
      aria-label={`${label} view`}
      className={clsx(
        "flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 border border-transparent outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        viewMode === mode
          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/50 border-indigo-50"
          : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
      )}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  // NO_FCP Protection Layer natively returning content before DOM fully evaluates the internal nodes
  if (!isInitialized || tasks.length === 0) {
    return (
      <main className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" aria-hidden="true"></div>
          <span id="loading-status" className="text-slate-700 font-bold text-sm tracking-widest animate-pulse uppercase" role="status">Loading...</span>
        </div>
      </main>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Live Collaboration Banner */}
      <div className="bg-indigo-950 border-b border-indigo-900 px-6 py-2.5 flex items-center justify-between text-white shrink-0 z-30 shadow-md select-none">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-1.5 mr-1 inline-flex" role="group" aria-label="Collaborators currently viewing">
             {collaborators.map(u => (
               <div key={u.id} className={clsx("w-6 h-6 rounded-full border-[1.5px] border-indigo-950 flex items-center justify-center text-[8px] font-bold shadow-sm", u.color)} role="img" aria-label={u.name}>
                 {getInitials(u.name)}
               </div>
             ))}
          </div>
          <span className="text-xs font-medium tracking-wide text-indigo-200">{collaborators.length} people are actively viewing this board</span>
        </div>
        <div className="flex items-center gap-2.5 pr-2" aria-hidden="true">
           <span className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
           </span>
           <span className="text-[10px] font-black text-emerald-400 tracking-widest">LIVE</span>
        </div>
      </div>

      {/* Dynamic Header */}
      <header className="bg-white px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 z-20 relative">
        <div className="flex items-center gap-4 shrink-0">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-2.5 rounded-xl shadow-[inset_0_1px_3px_rgba(255,255,255,0.4)] shadow-indigo-200 border border-indigo-400">
            <LayoutDashboard className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">Project Tracker</h1>
            <p className="text-xs text-slate-500 font-semibold mt-1 tracking-wide">{tasks.length} ACTIVE TASKS</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
          <div className="relative group w-full sm:w-auto shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" aria-hidden="true" />
            <label htmlFor="global-search-input" className="sr-only">Search tasks</label>
            <input
              id="global-search-input"
              type="text"
              aria-label="Search tasks"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all w-full sm:w-72 shadow-inner placeholder:text-slate-400 placeholder:font-semibold"
            />
          </div>
          
          <div className="flex border border-slate-200 p-1.5 rounded-xl bg-slate-100 shadow-[inset_0_1px_3px_rgba(0,0,0,0.03)] w-full sm:w-auto justify-center shrink-0" role="tablist" aria-label="View switching options">
            <NavButton mode="kanban" icon={LayoutDashboard} label="Board" />
            <NavButton mode="list" icon={List} label="List" />
            <NavButton mode="timeline" icon={CalendarDays} label="Timeline" />
          </div>
        </div>
      </header>

      {/* Dynamic Cross-Platform Multi-Select Filter Ribbon Layer */}
      <div className="bg-white border-y border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 z-40 shrink-0 shadow-sm relative w-full">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-xs font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-widest shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter by
          </div>
          
          <div className="h-4 w-px bg-slate-200 mx-1 shrink-0"></div>

          <MultiSelectDropdown 
            title="Status" 
            icon={LayoutDashboard}
            options={STATUSES} 
            selected={filters.status} 
            onChange={(status: TaskStatus[]) => setFilters({ status })} 
          />
          <MultiSelectDropdown 
            title="Priority" 
            icon={AlertCircle}
            options={PRIORITIES} 
            selected={filters.priority} 
            onChange={(priority: TaskPriority[]) => setFilters({ priority })} 
          />
          <MultiSelectDropdown 
            title="Assignee" 
            icon={Users}
            options={uniqueAssignees} 
            selected={filters.assignees} 
            onChange={(assignees: string[]) => setFilters({ assignees })} 
          />
          
          <div className="h-4 w-px bg-slate-200 mx-1 shrink-0"></div>

          <DateRangeFilter
             dateStart={filters.dateStart}
             dateEnd={filters.dateEnd}
             onChangeStart={(dateStart: string) => setFilters({ dateStart })}
             onChangeEnd={(dateEnd: string) => setFilters({ dateEnd })}
          />
        </div>

        {isFiltersActive && (
          <button 
            onClick={clearFilters}
            aria-label="Clear all filters"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-red-200 outline-none transition-colors border border-transparent hover:border-red-100 shrink-0"
          >
            <X className="w-3.5 h-3.5" strokeWidth={3} aria-hidden="true" /> Clear Filters
          </button>
        )}
      </div>

      {/* Component Core Dynamic Routing Canvas */}
      <main className="flex-1 overflow-hidden p-4 lg:p-6 relative z-0">
        <div className="h-full w-full max-w-[1600px] mx-auto relative rounded-xl flex flex-col">
          {renderView()}
        </div>
      </main>
      
      {/* Global Embedded Scrollbar Native Styling Definitions */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
          border: 3px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  );
}

export default App;
