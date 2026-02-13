// src/components/Header.tsx

import { LogOut } from 'lucide-react';

interface HeaderProps {
  username: string;
  activeTodos: number;
  onLogout: () => void;
}

export default function Header({ username, activeTodos, onLogout }: HeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-50">
          Todo
        </h1>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
      <p className="text-slate-600 dark:text-slate-400">
        Welcome, {username} • {activeTodos} {activeTodos === 1 ? 'task' : 'tasks'} remaining
      </p>
    </div>
  );
}
