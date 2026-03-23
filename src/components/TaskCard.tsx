import React from 'react';
import type { Task } from '../types';
import { getInitials } from '../utils';
import clsx from 'clsx';
import { CalendarIcon } from 'lucide-react';
import { useTaskStore } from '../store';

interface Props {
  task: Task;
}

export const TaskCard: React.FC<Props> = ({ task }) => {
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Done';
  const collaborators = useTaskStore(state => state.collaborators);
  const activeCollabs = collaborators.filter(c => c.activeTaskId === task.id);

  const priorityColors = {
    Low: 'bg-blue-100 text-blue-900 border-blue-200',
    Medium: 'bg-amber-100 text-amber-950 border-amber-200',
    Critical: 'bg-rose-100 text-rose-950 border-rose-200',
  };

  return (
    <article aria-labelledby={`task-title-${task.id}`} id={`task-${task.id}`} tabIndex={0} className="bg-white p-4 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col gap-3 group focus-visible:outline-indigo-500 focus-visible:ring-2 focus-visible:ring-offset-2 outline-none">
      <div className="flex justify-between items-start gap-2">
        <h3 id={`task-title-${task.id}`} className="font-medium text-slate-800 text-sm leading-tight line-clamp-2">{task.title}</h3>
      </div>
      
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={clsx(
            "text-[11px] font-semibold px-2 py-0.5 rounded-full border border-solid shrink-0",
            priorityColors[task.priority]
          )}>
            {task.priority}
          </span>
          <div className={clsx(
            "flex items-center gap-1 mx-1 text-xs shrink-0 font-medium",
            isOverdue ? "text-red-600" : "text-slate-500"
          )}>
            <CalendarIcon className="w-3.5 h-3.5" aria-hidden="true" />
            <span aria-label={isOverdue ? `Overdue on ${task.dueDate}` : `Due on ${task.dueDate}`}>{task.dueDate}</span>
          </div>
        </div>

        <div className="flex items-center">
          {activeCollabs.length > 0 && (
            <>
              <div className="flex -space-x-1.5 mr-2" role="group" aria-label="Collaborators working on this task">
                {activeCollabs.map(c => (
                  <div 
                    key={c.id} 
                    className={clsx(
                      "w-6 h-6 rounded-full border-[1.5px] border-white flex items-center justify-center text-[8px] font-black shadow-sm ring-1 ring-black/5 z-0 transition-all duration-500 ease-out starting:scale-0 starting:-translate-y-3 starting:opacity-0 scale-100 translate-y-0 opacity-100",
                      c.color
                    )}
                    role="img"
                    aria-label={`Collaborator: ${c.name}`}
                    title={`${c.name} is viewing`}
                  >
                    {getInitials(c.name)}
                  </div>
                ))}
              </div>
              <div className="w-px h-5 bg-slate-200 mr-2 shrink-0"></div>
            </>
          )}

          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 border border-white shadow-sm flex-shrink-0" title={`Assignee: ${task.assignee}`}>
            {getInitials(task.assignee)}
          </div>
        </div>
      </div>
    </article>
  );
};
