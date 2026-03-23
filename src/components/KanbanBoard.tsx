import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../store';
import type { TaskStatus, Task } from '../types';
import { TaskCard } from './TaskCard';
import clsx from 'clsx';

import { applyFilters } from '../utils';

export const KanbanBoard: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const searchQuery = useTaskStore((state) => state.searchQuery);
  const filters = useTaskStore((state) => state.filters);
  const updateTaskStatus = useTaskStore((state) => state.updateTaskStatus);
  const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];

  const filteredTasks = applyFilters(tasks, searchQuery, filters);

  const [draggedData, setDraggedData] = useState<{
    task: Task;
    cardRect: DOMRect;
    pointerX: number;
    pointerY: number;
    offsetX: number;
    offsetY: number;
    isSnapping: boolean;
  } | null>(null);

  const [hoveredCol, setHoveredCol] = useState<TaskStatus | null>(null);

  const handlePointerDown = (e: React.PointerEvent, task: Task, el: HTMLElement) => {
    // Only process primary mouse button or touch
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    
    // Optional: Capture pointer to track dragging seamlessly outside screen
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const rect = el.getBoundingClientRect();
    setDraggedData({
      task,
      cardRect: rect,
      pointerX: e.clientX,
      pointerY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      isSnapping: false,
    });
    setHoveredCol(task.status);
  };

  useEffect(() => {
    if (!draggedData || draggedData.isSnapping) return;

    const onPointerMove = (e: PointerEvent) => {
      // Prevent browser default behaviors like scrolling when dragging
      e.preventDefault(); 
      setDraggedData((prev) => prev ? { ...prev, pointerX: e.clientX, pointerY: e.clientY } : null);

      // Hide the drag overlay momentarily via pointer-events-none in its CSS
      // enabling us to figure out which column sits strictly beneath the pointer
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const col = elements.find(el => el.hasAttribute('data-status'));
      if (col) {
        setHoveredCol(col.getAttribute('data-status') as TaskStatus);
      } else {
        setHoveredCol(null);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const col = elements.find(el => el.hasAttribute('data-status'));
      const targetStatus = col ? (col.getAttribute('data-status') as TaskStatus) : null;

      if (targetStatus && targetStatus !== draggedData.task.status) {
        // Valid drop zone in a DIFFERENT column
        updateTaskStatus(draggedData.task.id, targetStatus);
        setDraggedData(null);
        setHoveredCol(null);
      } else {
        // Drop was invalid, or same column: trigger SNAP BACK
        setDraggedData((prev) => prev ? { ...prev, isSnapping: true } : null);
        setTimeout(() => {
          setDraggedData(null);
          setHoveredCol(null);
        }, 300); // 300ms matches the transition duration
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [draggedData, updateTaskStatus]);

  const isDragging = !!draggedData;
  const isSnapping = draggedData?.isSnapping;

  return (
    <>
      <ul className="flex h-full gap-6 overflow-x-auto pb-4 custom-scrollbar select-none relative" role="list" aria-label="Kanban Board Sections">
        {COLUMNS.map((status) => {
          const columnTasks = filteredTasks.filter((task) => task.status === status);
          const isHoveredCol = isDragging && !isSnapping && hoveredCol === status;

          return (
              <li 
                key={status} 
                data-status={status}
                aria-labelledby={`heading-${status}`}
                className={clsx(
                  "flex-1 min-w-[320px] max-w-[400px] flex flex-col rounded-2xl overflow-hidden shadow-sm border transition-all duration-300 list-none",
                  isHoveredCol 
                    ? "bg-indigo-50/80 border-indigo-300 ring-4 ring-indigo-500/10 shadow-indigo-100" 
                    : "bg-slate-100/80 border-slate-200/60"
                )}
              >
                <div className="p-4 border-b border-slate-200/60 bg-slate-100/50 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
                  <h2 id={`heading-${status}`} className={clsx("font-bold tracking-tight transition-colors", isHoveredCol ? "text-indigo-700" : "text-slate-700")}>
                    {status}
                  </h2>
                <span className={clsx(
                  "text-xs font-bold px-2.5 py-1 rounded-full border transition-colors",
                  isHoveredCol ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-slate-200/80 text-slate-600 border-slate-300/50"
                )}>
                  {columnTasks.length}
                </span>
              </div>
              <ul 
                className="p-4 flex-1 overflow-y-auto flex flex-col gap-3 custom-scrollbar focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/20" 
                role="list" 
                tabIndex={0}
                aria-label={`Tasks in ${status}`}
              >
                {columnTasks.map((task) => {
                  const isBeingDragged = isDragging && draggedData.task.id === task.id;

                  return (
                    <li
                      key={task.id}
                      className={clsx(
                        "touch-none transition-all duration-200 list-none", 
                        isBeingDragged ? "opacity-30 scale-95 opacity-50 overflow-hidden rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/30" : ""
                      )}
                      onPointerDown={(e) => {
                        if (!isDragging) {
                          handlePointerDown(e, task, e.currentTarget);
                        }
                      }}
                    >
                      <div className={clsx("pointer-events-none", isBeingDragged && "invisible")}>
                        <TaskCard task={task} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li >
          );
        })}
      </ul>

      {/* Floating Drag Overlay */}
      {isDragging && (
        <div
          className={clsx(
            "fixed z-50 pointer-events-none transition-transform will-change-transform",
            isSnapping ? "duration-300 ease-out" : "duration-0"
          )}
          style={{
            width: draggedData.cardRect.width,
            height: draggedData.cardRect.height,
            left: 0,
            top: 0,
            transform: isSnapping 
              ? `translate(${draggedData.cardRect.left}px, ${draggedData.cardRect.top}px)` 
              : `translate(${draggedData.pointerX - draggedData.offsetX}px, ${draggedData.pointerY - draggedData.offsetY}px)`,
          }}
        >
          <div className={clsx(
            "w-full h-full shadow-[0_20px_40px_rgba(0,0,0,0.15)] rounded-xl transition-all duration-200",
            !isSnapping && "scale-105 rotate-2 shadow-indigo-500/20 shadow-2xl"
          )}>
            <TaskCard task={draggedData.task} />
          </div>
        </div>
      )}
    </>
  );
};
