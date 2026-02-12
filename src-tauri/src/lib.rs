// src-tauri/src/lib.rs

use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use tauri_plugin_sql::{Builder, Migration, MigrationKind};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: i64,
    pub username: String,
}

#[derive(Default)]
pub struct AppState {
    pub current_user: Mutex<Option<User>>,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub success: bool,
    pub message: String,
    pub user: Option<User>,
}

fn validate_password(password: &str) -> Result<(), String> {
    if password.len() < 8 {
        return Err("Password must be at least 8 characters long".to_string());
    }

    if !password.chars().any(|c| c.is_uppercase()) {
        return Err("Password must contain at least one uppercase letter".to_string());
    }

    if !password.chars().any(|c| c.is_lowercase()) {
        return Err("Password must contain at least one lowercase letter".to_string());
    }

    if !password.chars().any(|c| c.is_numeric()) {
        return Err("Password must contain at least one number".to_string());
    }

    Ok(())
}

#[tauri::command]
async fn register_user(
    username: String,
    password: String,
) -> Result<AuthResponse, String> {
    // Validate username
    if username.trim().is_empty() {
        return Ok(AuthResponse {
            success: false,
            message: "Username cannot be empty".to_string(),
            user: None,
        });
    }

    // Validate password requirements
    if let Err(msg) = validate_password(&password) {
        return Ok(AuthResponse {
            success: false,
            message: msg,
            user: None,
        });
    }

    // Hash password using argon2
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| format!("Failed to hash password: {}", e))?
        .to_string();

    // Return hash to be stored by frontend
    Ok(AuthResponse {
        success: true,
        message: password_hash,
        user: None,
    })
}

#[tauri::command]
async fn verify_password(password: String, password_hash: String) -> Result<bool, String> {
    let parsed_hash = PasswordHash::new(&password_hash)
        .map_err(|e| format!("Invalid password hash: {}", e))?;

    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}

#[tauri::command]
async fn login_user(
    username: String,
    user_id: i64,
    state: State<'_, AppState>,
) -> Result<AuthResponse, String> {
    let user = User {
        id: user_id,
        username: username.clone(),
    };

    // Store in app state
    *state.current_user.lock().unwrap() = Some(user.clone());

    Ok(AuthResponse {
        success: true,
        message: "Login successful".to_string(),
        user: Some(user),
    })
}

#[tauri::command]
async fn logout_user(state: State<'_, AppState>) -> Result<(), String> {
    *state.current_user.lock().unwrap() = None;
    Ok(())
}

#[tauri::command]
async fn get_current_user(state: State<'_, AppState>) -> Result<Option<User>, String> {
    Ok(state.current_user.lock().unwrap().clone())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        // Migration 1: Create users table
        Migration {
            version: 1,
            description: "create_users_table",
            sql: "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);",
            kind: MigrationKind::Up,
        },
        // Migration 2: Create todos table with user_id
        Migration {
            version: 2,
            description: "create_todos_table",
            sql: "CREATE TABLE IF NOT EXISTS todos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                text TEXT NOT NULL,
                completed INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
            CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .manage(AppState::default())
        .plugin(
            Builder::default()
                .add_migrations("sqlite:todos.db", migrations)
                .build()
        )
        .invoke_handler(tauri::generate_handler![
            register_user,
            verify_password,
            login_user,
            logout_user,
            get_current_user,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
