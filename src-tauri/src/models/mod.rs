// src-tauri/src/models/mod.rs

pub mod user;
pub mod app_state;

pub use user::{User, AuthResponse};
pub use app_state::AppState;
