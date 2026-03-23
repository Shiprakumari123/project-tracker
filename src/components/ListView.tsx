import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTaskStore } from '../store';
import { applyFilters, getInitials } from '../utils';
import clsx from 'clsx';
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarIcon } from 'lucide-react';
import type { TaskStatus } from '../types';

type SortKey = 'title' | 'priority' | 'dueDate';

export const ListView: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const searchQuery = useTaskStore((state) => state.searchQuery);
  const filters = useTaskStore((state) => state.filters);
  const updateTaskStatus = useTaskStore((state) => state.updateTaskStatus);
  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [sortAsc, setSortAsc] = useState(true);

  // Virtual Scrolling State
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(800);

  const ROW_HEIGHT = 64; // Strict table row height
  const BUFFER_ROWS = 5;

  const priorityWeight = { Low: 1, Medium: 2, Critical: 3 };

  const filteredTasks = useMemo(() => {
    return applyFilters(tasks, searchQuery, filters);
  }, [tasks, searchQuery, filters]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let result = 0;
      if (sortKey === 'title') {
        result = a.title.localeCompare(b.title);
      } else if (sortKey === 'priority') {
        result = priorityWeight[a.priority] - priorityWeight[b.priority];
      } else if (sortKey === 'dueDate') {
        result = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return sortAsc ? result : -result;
    });
  }, [filteredTasks, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'priority' ? false : true); 
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(Math.max(0, e.currentTarget.scrollTop));
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContainerHeight(entries[0].contentRect.height);
    });
    observer.observe(containerRef.current);
    setContainerHeight(containerRef.current.clientHeight);
    return () => observer.disconnect();
  }, []);

  // Virtual Scroll Core Calculation
  const visibleRowCount = Math.ceil(containerHeight / ROW_HEIGHT);
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
  const endIndex = Math.min(sortedTasks.length, Math.floor(scrollTop / ROW_HEIGHT) + visibleRowCount + BUFFER_ROWS);
  
  const visibleTasks = useMemo(() => sortedTasks.slice(startIndex, endIndex), [sortedTasks, startIndex, endIndex]);
  
  const topPadding = startIndex * ROW_HEIGHT;
  const bottomPadding = Math.max(0, (sortedTasks.length - endIndex) * ROW_HEIGHT);

  const priorityColors = {
    Low: 'bg-blue-100 text-blue-900 border-blue-200 border',
    Medium: 'bg-amber-100 text-amber-950 border-amber-200 border',
    Critical: 'bg-rose-100 text-rose-950 border-rose-200 border',
  };

  const STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-50 ml-1" />;
    return sortAsc ? <ArrowUp className="w-4 h-4 text-indigo-600 ml-1" /> : <ArrowDown className="w-4 h-4 text-indigo-600 ml-1" />;
  };

  const Th = ({ columnKey, children }: { columnKey: SortKey, children: React.ReactNode }) => (
    <th 
      aria-sort={sortKey === columnKey ? (sortAsc ? 'ascending' : 'descending') : 'none'}
      role="columnheader"
      tabIndex={0}
      className={clsx(
        "px-6 py-4 font-semibold cursor-pointer transition-colors select-none group h-[56px] focus-visible:outline-indigo-500 focus-visible:ring-2 focus-visible:ring-inset",
        sortKey === columnKey ? "bg-indigo-50/50 text-indigo-900 shadow-[inset_0_-2px_0_theme(colors.indigo.500)]" : "hover:bg-slate-100"
      )}
      onClick={() => handleSort(columnKey)}
      onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort(columnKey); } }}
    >
      <div className="flex items-center">
        {children}
        <SortIcon columnKey={columnKey} />
      </div>
    </th>
  );

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200 h-full flex flex-col relative overflow-hidden">
      {/* Table Container - Overflow handles native custom virtual scroll mapping */}
      <div 
        className="flex-1 overflow-auto custom-scrollbar focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/20 relative will-change-scroll transform-gpu" 
        onScroll={handleScroll} 
        ref={containerRef}
        role="region"
        tabIndex={0}
        aria-label="Tasks List Grid"
      >
        <table className="w-full text-left border-collapse min-w-[900px] table-fixed" role="grid">
          <caption className="sr-only">List of tasks with details including status, priority, and assignee</caption>
          <thead className="sticky top-0 bg-slate-50 z-20 shadow-[0_1px_0_theme(colors.slate.200)] backdrop-blur-md">
            <tr className="text-slate-600 text-sm h-[56px] border-b border-slate-200 bg-slate-50/90">
              <Th columnKey="title">Task Title</Th>
              <th className="px-6 py-4 font-semibold w-[180px]">Status</th>
              <Th columnKey="priority">Priority</Th>
              <th className="px-6 py-4 font-semibold w-[200px]">Assignee</th>
              <Th columnKey="dueDate">Due Date</Th>
            </tr>
          </thead>
          <tbody className="text-sm bg-white border-none">
            {topPadding > 0 && (
              <tr style={{ height: `${topPadding}px` }} className="border-none">
                <td colSpan={5} className="p-0 border-none"></td>
              </tr>
            )}
            
            {visibleTasks.map((task) => {
              const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Done';
              const activeCollabs = useTaskStore.getState().collaborators.filter(c => c.activeTaskId === task.id);

              return (
                <tr 
                  key={task.id} 
                  id={`task-${task.id}`}
                  className="hover:bg-slate-50/80 group border-b border-slate-100 transition-colors"
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  <td className="px-6 py-0 font-medium text-slate-800 truncate relative" title={task.title}>
                    <div className="flex items-center gap-2">
                      <span className="truncate">{task.title}</span>
                      {activeCollabs.length > 0 && (
                        <div className="flex -space-x-1 shrink-0 opacity-90 ml-1">
                          {activeCollabs.map(c => (
                            <div key={c.id} className={clsx("w-5 h-5 rounded-full border border-white flex items-center justify-center text-[7px] font-black shadow-sm transition-all duration-500 ease-out starting:scale-0 starting:translate-x-3 starting:opacity-0 scale-100 translate-x-0 opacity-100", c.color)}>
                              {getInitials(c.name)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-0 relative">
                    <div className="relative inline-block w-full">
                      <select
                        aria-label={`Update status for ${task.title}`}
                        className={clsx(
                          "w-full appearance-none bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-3 py-1.5 pr-8 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer hover:bg-slate-200 transition-colors shadow-sm",
                          task.status === 'Done' ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : ""
                        )}
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                      >
                        {STATUSES.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-0">
                    <span className={clsx("px-2.5 py-1 rounded-full text-[11px] font-bold select-none", priorityColors[task.priority])}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 border border-white shadow-sm" title={task.assignee}>
                        {getInitials(task.assignee)}
                      </div>
                      <span className="text-slate-600 font-medium truncate">{task.assignee}</span>
                    </div>
                  </td>
                  <td className="px-6 py-0 font-medium">
                     <div className={clsx(
                        "flex items-center gap-1.5 text-xs",
                        isOverdue ? "text-red-600" : "text-slate-500"
                      )}>
                        {isOverdue && <CalendarIcon className="w-3.5 h-3.5" />}
                        <span>{task.dueDate}</span>
                     </div>
                  </td>
                </tr>
              );
            })}
            
            {bottomPadding > 0 && (
              <tr style={{ height: `${bottomPadding}px` }} className="border-none">
                <td colSpan={5} className="p-0 border-none"></td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Empty State mapping */}
        {sortedTasks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center top-[56px] text-slate-400 font-medium text-sm">
            No matching tasks found.
          </div>
        )}
      </div>
    </div>
  );
};
