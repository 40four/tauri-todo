// src/components/TodoItem.tsx

import { Check, Trash2 } from 'lucide-react';
import { Todo } from '../types';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number, completed: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(todo.id, todo.completed)}
          className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
            todo.completed
              ? 'bg-slate-900 dark:bg-slate-50 border-slate-900 dark:border-slate-50'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          {todo.completed ? (
            <Check className="w-4 h-4 text-white dark:text-slate-900" />
          ) : null}
        </button>

        {/* Todo Text */}
        <span
          className={`flex-1 transition-all ${
            todo.completed
              ? 'text-slate-400 dark:text-slate-600 line-through'
              : 'text-slate-900 dark:text-slate-50'
          }`}
        >
          {todo.text}
        </span>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(todo.id)}
          className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
