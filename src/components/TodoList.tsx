// src/components/TodoList.tsx

import { Todo } from '../types';
import TodoItem from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  loading: boolean;
  onToggle: (id: number, completed: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function TodoList({ todos, loading, onToggle, onDelete }: TodoListProps) {
  if (loading) {
    return (
      <div className="text-center py-12 text-slate-500">
        Loading...
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No todos yet. Add one above!
      </div>
    );
  }

  const completedCount = todos.filter(t => t.completed).length;

  return (
    <>
      <div className="space-y-2">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Stats Footer */}
      {todos.length > 0 && (
        <div className="mt-6 text-center text-sm text-slate-500">
          {completedCount} of {todos.length} completed
        </div>
      )}
    </>
  );
}
