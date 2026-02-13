// src/hooks/useDatabase.ts

import { useState, useEffect } from 'react';
import Database from '@tauri-apps/plugin-sql';
import { User } from '../types';

export function useDatabase(user: User | null) {
  const [db, setDb] = useState<Database | null>(null);

  useEffect(() => {
    if (!user) {
      setDb(null);
      return;
    }

    async function initDb() {
      try {
        const database = await Database.load('sqlite:todos.db');

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

  return db;
}
