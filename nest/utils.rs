use crate::NestError;
use rand::RngExt;
use std::{io::ErrorKind, path::Path};

// pub mod serdu;

/// ignore error if err == `ErrorKind::AlreadyExists`
pub fn create_dir<P: AsRef<Path>>(path: P) -> std::io::Result<()> {
    match std::fs::create_dir(path) {
        Ok(_) => {}
        Err(e) if e.kind() == ErrorKind::AlreadyExists => {}
        Err(e) => return Err(e),
    }

    Ok(())
}

// pub fn to_record_name(file_name: &Option<String>) -> String {
//     let Some(file_name) = file_name else { return String::new() };
//
//     let mut out = String::from(file_name);
//     while out.len() > 32 {
//         out.remove(0);
//     }
//     out
// }

pub fn random_salt() -> String {
    let salt: u64 = rand::random();
    format!("{salt:016x}")
}

pub fn random_string(charset: &[u8], len: usize) -> String {
    let mut rng = rand::rng();
    (0..len)
        .map(|_| charset[rng.random_range(0..charset.len())] as char)
        .collect()
}

pub fn user_phone_validator(phone: &str) -> Result<(), NestError> {
    if phone.len() != 11 || !phone.starts_with("09") {
        return Err(NestError::BadPhone);
    }
    if phone.chars().any(|c| !c.is_ascii_digit()) {
        return Err(NestError::BadPhone);
    }

    Ok(())
}

pub fn sys_now() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

pub fn normalize_text(text: &str) -> String {
    text.trim()
        .chars()
        .flat_map(|c| match c {
            'ي' => Some('ی'),
            'ك' => Some('ک'),
            '۰' | '٠' => Some('0'),
            '۱' | '١' => Some('1'),
            '۲' | '٢' => Some('2'),
            '۳' | '٣' => Some('3'),
            '۴' | '٤' => Some('4'),
            '۵' | '٥' => Some('5'),
            '۶' | '٦' => Some('6'),
            '۷' | '٧' => Some('7'),
            '۸' | '٨' => Some('8'),
            '۹' | '٩' => Some('9'),
            '\u{064B}'..='\u{065F}' => None,
            _ => Some(c),
        })
        .collect::<String>()
}
