// src-tauri/src/commands/mod.rs

pub mod auth;
pub mod password;

pub use auth::{register_user, verify_password, login_user, logout_user, get_current_user};
