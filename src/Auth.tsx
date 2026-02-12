import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";
import { User, Lock } from 'lucide-react';

interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    username: string;
  };
}

interface AuthProps {
  onAuthSuccess: (user: { id: number; username: string }) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      // Get password hash from Rust
      const response = await invoke<AuthResponse>('register_user', {
        username,
        password,
      });

      if (!response.success) {
        setError(response.message);
        return;
      }

      const passwordHash = response.message; // Hash is in message field

      // Store user in database
      const db = await Database.load("sqlite:todos.db");
      
      // Check if username already exists
      const existing = await db.select<Array<{ id: number }>>(
        "SELECT id FROM users WHERE username = $1",
        [username]
      );

      if (existing.length > 0) {
        setError("Username already exists");
        return;
      }

      // Insert new user
      const result = await db.execute(
        "INSERT INTO users (username, password_hash) VALUES ($1, $2)",
        [username, passwordHash]
      );

      const newUser = {
        id: result.lastInsertId,
        username,
      };

      // Log the user in
      await invoke('login_user', {
        username,
        userId: result.lastInsertId,
      });

      onAuthSuccess(newUser);
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error(err);
    }
  };

  const handleLogin = async () => {
    try {
      const db = await Database.load("sqlite:todos.db");
      
      // Find user by username
      const users = await db.select<Array<{ id: number; username: string; password_hash: string }>>(
        "SELECT id, username, password_hash FROM users WHERE username = $1",
        [username]
      );

      if (users.length === 0) {
        setError("Invalid username or password");
        return;
      }

      const user = users[0];

      // Verify password using Rust command
      const isValid = await invoke<boolean>('verify_password', {
        password,
        passwordHash: user.password_hash,
      });

      if (!isValid) {
        setError("Invalid username or password");
        return;
      }

      // Set user in app state
      await invoke('login_user', {
        username: user.username,
        userId: user.id,
      });

      onAuthSuccess({
        id: user.id,
        username: user.username,
      });
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Todo
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600"
                  placeholder="Enter password"
                  required
                />
              </div>
              {!isLogin && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Must be 8+ characters with uppercase, lowercase, and number
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
