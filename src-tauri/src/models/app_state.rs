// src-tauri/src/models/app_state.rs

use std::sync::Mutex;
use super::user::User;

#[derive(Default)]
pub struct AppState {
    pub current_user: Mutex<Option<User>>,
}
