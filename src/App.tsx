import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";
import { Check, Plus, Trash2, LogOut } from 'lucide-react';
import Auth from "./Auth";
import "./App.css";

interface Todo {
  id: number;
  text: string;
  completed: number;
  user_id: number;
}

interface User {
  id: number;
  username: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [db, setDb] = useState<Database | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await invoke<User | null>('get_current_user');
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to check auth:', error);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);

  // Initialize database when user logs in
  useEffect(() => {
    if (!user) return;

    async function initDb() {
      try {
        const database = await Database.load("sqlite:todos.db");
        
        // Create users table if it doesn't exist
        await database.execute(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create todos table with user_id
        await database.execute(`
          CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
        
        setDb(database);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    }
    
    initDb();
  }, [user]);

  // Load todos when db is ready
  useEffect(() => {
    if (db && user) {
      loadTodos();
    }
  }, [db, user]);

  const loadTodos = async (): Promise<void> => {
    if (!db || !user) return;
    
    setLoading(true);
    try {
      const result = await db.select<Todo[]>(
        "SELECT id, text, completed, user_id FROM todos WHERE user_id = $1 ORDER BY created_at DESC",
        [user.id]
      );
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newTodo.trim() || !db || !user) return;

    try {
      const result = await db.execute(
        "INSERT INTO todos (text, completed, user_id) VALUES ($1, 0, $2)",
        [newTodo, user.id]
      );
      
      const newTodoItem: Todo = {
        id: result.lastInsertId,
        text: newTodo,
        completed: 0,
        user_id: user.id,
      };
      setTodos([newTodoItem, ...todos]);
      setNewTodo('');
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const toggleTodo = async (id: number, currentCompleted: number): Promise<void> => {
    if (!db) return;
    
    try {
      await db.execute(
        "UPDATE todos SET completed = $1 WHERE id = $2",
        [currentCompleted ? 0 : 1, id]
      );
      
      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, completed: currentCompleted ? 0 : 1 } : todo
      ));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const deleteTodo = async (id: number): Promise<void> => {
    if (!db) return;
    
    try {
      await db.execute("DELETE FROM todos WHERE id = $1", [id]);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await invoke('logout_user');
      setUser(null);
      setTodos([]);
      setDb(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
  };

  // Show loading state on initial load
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  const activeTodos = todos.filter(t => !t.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-50">
              Todo
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Welcome, {user.username} • {activeTodos} {activeTodos === 1 ? 'task' : 'tasks'} remaining
          </p>
        </div>

        {/* Add Todo Form */}
        <form onSubmit={addTodo} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors flex items-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </form>

        {/* Todo List */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12 text-slate-500">
              Loading...
            </div>
          ) : todos.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No todos yet. Add one above!
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTodo(todo.id, todo.completed)}
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
                    onClick={() => deleteTodo(todo.id)}
                    className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats Footer */}
        {todos.length > 0 && (
          <div className="mt-6 text-center text-sm text-slate-500">
            {todos.filter(t => t.completed).length} of {todos.length} completed
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
