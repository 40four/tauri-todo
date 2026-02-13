// src-tauri/src/commands/auth.rs

use tauri::State;
use crate::models::{User, AuthResponse, AppState};
use super::password::{validate_password, hash_password, verify_password_hash};

#[tauri::command]
pub async fn register_user(
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

    // Hash password
    let password_hash = hash_password(&password)?;

    // Return hash to be stored by frontend
    Ok(AuthResponse {
        success: true,
        message: password_hash,
        user: None,
    })
}

#[tauri::command]
pub async fn verify_password(password: String, password_hash: String) -> Result<bool, String> {
    verify_password_hash(&password, &password_hash)
}

#[tauri::command]
pub async fn login_user(
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
pub async fn logout_user(state: State<'_, AppState>) -> Result<(), String> {
    *state.current_user.lock().unwrap() = None;
    Ok(())
}

#[tauri::command]
pub async fn get_current_user(state: State<'_, AppState>) -> Result<Option<User>, String> {
    Ok(state.current_user.lock().unwrap().clone())
}
