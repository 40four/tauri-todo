// src/hooks/useTodos.ts

import { useState, useEffect } from 'react';
import Database from '@tauri-apps/plugin-sql';
import { Todo, User } from '../types';

export function useTodos(db: Database | null, user: User | null) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);

  // Load todos when db is ready
  useEffect(() => {
    if (db && user) {
      loadTodos();
    } else {
      setTodos([]);
    }
  }, [db, user]);

  const loadTodos = async () => {
    if (!db || !user) return;

    setLoading(true);
    try {
      const result = await db.select<Todo[]>(
        'SELECT id, text, completed, user_id FROM todos WHERE user_id = $1 ORDER BY created_at DESC',
        [user.id]
      );
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (text: string) => {
    if (!text.trim() || !db || !user) return;

    try {
      const result = await db.execute(
        'INSERT INTO todos (text, completed, user_id) VALUES ($1, 0, $2)',
        [text, user.id]
      );

      const newTodoItem: Todo = {
        id: result.lastInsertId,
        text,
        completed: 0,
        user_id: user.id,
      };
      setTodos([newTodoItem, ...todos]);
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const toggleTodo = async (id: number, currentCompleted: number) => {
    if (!db) return;

    try {
      await db.execute('UPDATE todos SET completed = $1 WHERE id = $2', [
        currentCompleted ? 0 : 1,
        id,
      ]);

      setTodos(
        todos.map((todo) =>
          todo.id === id
            ? { ...todo, completed: currentCompleted ? 0 : 1 }
            : todo
        )
      );
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const deleteTodo = async (id: number) => {
    if (!db) return;

    try {
      await db.execute('DELETE FROM todos WHERE id = $1', [id]);
      setTodos(todos.filter((todo) => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  return { todos, loading, addTodo, toggleTodo, deleteTodo };
}
