// src/App.tsx

import { useAuth } from './hooks/useAuth';
import { useDatabase } from './hooks/useDatabase';
import { useTodos } from './hooks/useTodos';
import Auth from './Auth';
import Header from './components/Header';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import './App.css';
import OcrScanner from './components/OcrScanner';

function App() {
  const { user, loading, login, logout } = useAuth();
  const db = useDatabase(user);
  const { todos, loading: todosLoading, addTodo, toggleTodo, deleteTodo } = useTodos(db, user);

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
    return <Auth onAuthSuccess={login} />;
  }

  const activeTodos = todos.filter((t) => !t.completed).length;

  const handleTextExtracted = (text: string) => {
    console.log('Extracted text:', text);
    // You can process the extracted text here
    // For example, parse earnings data, add to todos, etc.
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Header username={user.username} activeTodos={activeTodos} onLogout={logout} />
        
        {/* Add OCR Scanner */}
        <OcrScanner onTextExtracted={handleTextExtracted} />
        
        <TodoForm onAddTodo={addTodo} />
        <TodoList todos={todos} loading={todosLoading} onToggle={toggleTodo} onDelete={deleteTodo} />
      </div>
    </div>
  );
}

export default App;
