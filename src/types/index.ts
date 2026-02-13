// src/types/index.ts

export interface Todo {
  id: number;
  text: string;
  completed: number;
  user_id: number;
}

export interface User {
  id: number;
  username: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}
