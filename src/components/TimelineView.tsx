import React, { useMemo, useEffect, useRef } from 'react';
import { useTaskStore } from '../store';
import { format, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday, startOfDay } from 'date-fns';
import clsx from 'clsx';
import { applyFilters, getInitials } from '../utils';

export const TimelineView: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const searchQuery = useTaskStore((state) => state.searchQuery);
  const filters = useTaskStore((state) => state.filters);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const filteredTasks = useMemo(() => {
    return applyFilters(tasks, searchQuery, filters);
  }, [tasks, searchQuery, filters]);
  
  // Calculate range - Current Month
  const { startDate, endDate, dateHeaders, todayIndex } = useMemo(() => {
    const today = startOfDay(new Date());
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const headers = eachDayOfInterval({ start, end });
    const tIndex = headers.findIndex(d => isToday(d));
    return { startDate: start, endDate: end, dateHeaders: headers, todayIndex: tIndex };
  }, []);

  // Filter tasks to only show those active in current month
  const visibleTasks = useMemo(() => {
    return filteredTasks.filter(task => {
      // Treat tasks without start dates as single-day events on dueDate
      const taskStart = task.startDate ? startOfDay(new Date(task.startDate)) : startOfDay(new Date(task.dueDate));
      const taskEnd = startOfDay(new Date(task.dueDate));
      return taskStart <= endDate && taskEnd >= startDate;
    });
  }, [filteredTasks, startDate, endDate]);

  const priorityColors = {
    Low: 'bg-blue-600',
    Medium: 'bg-amber-600',
    Critical: 'bg-rose-700',
  };

  useEffect(() => {
    // Automatically smooth scroll horizontally to "Today" when view loads
    if (scrollContainerRef.current && todayIndex > -1) {
      const targetScroll = (todayIndex * 48) - 150; // 48px = 3rem day width, minus slight offset to center
      scrollContainerRef.current.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
    }
  }, [todayIndex]);

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden flex flex-col h-full relative">
      <div 
        className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/20 will-change-scroll transform-gpu relative z-0"
        ref={scrollContainerRef}
        tabIndex={0}
        role="region"
        aria-label="Timeline Gantt Chart"
      >
        <div className="min-w-max inline-block align-top pb-10 relative z-0" role="grid" aria-labelledby="timeline-month-header">
          
          {/* Timeline Header */}
          <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-40 shadow-[0_1px_0_theme(colors.slate.200)]" role="row">
            <h2 id="timeline-month-header" className="w-64 flex-shrink-0 p-4 font-semibold text-slate-700 border-r border-slate-200 sticky left-0 bg-slate-50 z-50 shadow-[4px_0_15px_-3px_rgba(0,0,0,0.1)]">
              {format(new Date(), 'MMMM yyyy')} Timeline
            </h2>
            <div className="flex relative">
              {dateHeaders.map((date, i) => {
                const isTodayDate = i === todayIndex;
                return (
                  <div key={i} className={clsx(
                    "w-12 flex-shrink-0 flex flex-col items-center justify-center py-2 text-xs relative",
                    isTodayDate ? "text-indigo-700 bg-indigo-50/50" : "text-slate-500"
                  )}>
                    <span className={clsx("font-semibold", isTodayDate && "font-bold text-indigo-700")}>{format(date, 'MMM')}</span>
                    <span className={clsx(isTodayDate && "font-bold text-indigo-700")}>{format(date, 'd')}</span>
                    <div className={clsx(
                      "absolute right-0 top-0 bottom-0 border-r border-dashed",
                      isTodayDate ? "border-indigo-300" : "border-slate-200"
                    )}></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Global Vertical Target Line for Today */}
          {todayIndex > -1 && (
            <div 
              className="absolute top-0 bottom-0 w-[2px] bg-indigo-500/40 z-20 pointer-events-none"
              style={{ left: `calc(16rem + ${todayIndex * 3}rem + 1.5rem)` }}
            >
              {/* Top explicit dot marker mapping strictly beneath sticky header explicitly via margin */}
              <div className="absolute top-[48px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_8px_theme(colors.indigo.500)]"></div>
            </div>
          )}

          {/* Render Timeline Task Rows */}
          <div className="flex flex-col relative bg-slate-50/30 z-0">
            {visibleTasks.map((task) => {
              const taskStart = task.startDate ? startOfDay(new Date(task.startDate)) : startOfDay(new Date(task.dueDate));
              const taskEnd = startOfDay(new Date(task.dueDate));
              
              const startOffset = differenceInDays(taskStart, startDate);
              const duration = Math.max(differenceInDays(taskEnd, taskStart) + 1, 1);
              const isOverdue = taskEnd < new Date() && task.status !== 'Done';
              const activeCollabs = useTaskStore.getState().collaborators.filter(c => c.activeTaskId === task.id);

              return (
                <div key={task.id} id={`task-${task.id}`} role="row" className="flex border-b border-slate-100 hover:bg-white group transition-colors">
                  {/* Sticky Task Data Panel */}
                  <div className="w-64 flex-shrink-0 p-3 flex flex-col justify-center border-r border-slate-200 sticky left-0 bg-slate-50 group-hover:bg-white z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors">
                    <div className="flex items-center gap-2">
                       <h3 id={`timeline-task-${task.id}`} className="text-sm font-semibold text-slate-800 truncate" title={task.title}>{task.title}</h3>
                       {activeCollabs.length > 0 && (
                          <div className="flex -space-x-1 shrink-0 opacity-90 inline-flex">
                            {activeCollabs.map(c => (
                              <div key={c.id} title={c.name} className={clsx("w-4 h-4 rounded-full border border-white flex items-center justify-center text-[6px] font-black shadow-sm transition-all duration-500 ease-out starting:scale-0 starting:-translate-y-2 starting:opacity-0 scale-100 translate-y-0 opacity-100", c.color)}>
                                {getInitials(c.name)}
                              </div>
                            ))}
                          </div>
                       )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 border border-white shrink-0 shadow-sm" title={task.assignee}>
                          {getInitials(task.assignee)}
                        </div>
                        <span className="truncate max-w-[100px]">{task.assignee}</span>
                      </div>
                      {isOverdue && <span className="text-[10px] bg-red-100/80 border border-red-200 text-red-700 px-1.5 py-0.5 rounded-full font-bold">Late</span>}
                    </div>
                  </div>
                  
                  {/* Native Timeline Grid Overlapping Render */}
                  <div className="flex relative items-center py-2 h-[60px] w-full">
                    {/* Background Column Dividers */}
                    {dateHeaders.map((_, i) => (
                      <div key={i} className={clsx(
                        "w-12 h-[60px] absolute top-0 bottom-0 border-r border-dashed",
                        i === todayIndex ? "border-indigo-300 bg-indigo-50/20" : "border-slate-200"
                      )} style={{ left: `${i * 3}rem` }}></div>
                    ))}
                    
                    {/* Absolute Gantt Render Object */}
                    <div 
                      role="img"
                      aria-label={`Task: ${task.title}, starts ${format(taskStart, 'MMM d')}, ends ${format(taskEnd, 'MMM d')}, priority ${task.priority}`}
                      className={clsx(
                        "absolute rounded shadow-sm transition-all group-hover:opacity-100 group-hover:shadow-md flex items-center px-3 text-xs font-semibold text-white overflow-hidden whitespace-nowrap z-10 select-none", 
                        priorityColors[task.priority],
                        duration === 1 ? "justify-center rounded-full w-7 h-7 !p-0" : "opacity-90 h-7"
                      )}
                      style={{
                        left: `${startOffset * 3}rem`, // Shift into explicit grid block based on start date logic
                        width: duration === 1 ? '1.75rem' : `calc(${duration * 3}rem - 8px)`, // Add slight negative pad ensuring bar physically doesn't bleed into next subsequent unmapped grid day
                        marginLeft: duration === 1 ? '0.625rem' : '4px' // Centering offset targeting logic mapping
                      }}
                      title={`${task.title} (${format(taskStart, 'MMM d')} - ${format(taskEnd, 'MMM d')})`}
                    >
                      {duration > 1 && task.title}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty Context Overlay */}
            {visibleTasks.length === 0 && (
              <div className="p-16 text-center text-slate-500 font-medium text-sm flex-1 absolute top-0 left-64 right-0 bottom-0 flex items-center justify-center">
                <div className="bg-slate-50 rounded-lg border border-slate-200 px-8 py-6 shadow-sm">
                  No active tasks mapped strictly in {format(new Date(), 'MMMM yyyy')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
