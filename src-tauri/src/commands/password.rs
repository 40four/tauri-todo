// src-tauri/src/commands/password.rs

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};

/// Validate password requirements
pub fn validate_password(password: &str) -> Result<(), String> {
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

/// Hash a password using Argon2
pub fn hash_password(password: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|e| format!("Failed to hash password: {}", e))
}

/// Verify a password against a hash
pub fn verify_password_hash(password: &str, password_hash: &str) -> Result<bool, String> {
    let parsed_hash = PasswordHash::new(password_hash)
        .map_err(|e| format!("Invalid password hash: {}", e))?;

    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_password_too_short() {
        assert!(validate_password("Short1").is_err());
    }

    #[test]
    fn test_validate_password_no_uppercase() {
        assert!(validate_password("lowercase123").is_err());
    }

    #[test]
    fn test_validate_password_no_lowercase() {
        assert!(validate_password("UPPERCASE123").is_err());
    }

    #[test]
    fn test_validate_password_no_number() {
        assert!(validate_password("NoNumbers").is_err());
    }

    #[test]
    fn test_validate_password_valid() {
        assert!(validate_password("ValidPass123").is_ok());
    }

    #[test]
    fn test_hash_and_verify() {
        let password = "TestPassword123";
        let hash = hash_password(password).unwrap();
        assert!(verify_password_hash(password, &hash).unwrap());
        assert!(!verify_password_hash("WrongPassword", &hash).unwrap());
    }
}
