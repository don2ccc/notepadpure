use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Serialize, Deserialize)]
pub struct FileInfo {
    name: String,
    path: String,
    is_dir: bool,
    is_file: bool,
}

#[derive(Serialize, Deserialize)]
pub struct FileContent {
    content: String,
    encoding: String,
}

// Read directory contents
#[tauri::command]
fn read_directory(path: String) -> Result<Vec<FileInfo>, String> {
    let path = Path::new(&path);
    if !path.exists() {
        return Err("Path does not exist".to_string());
    }
    
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
    let mut files = Vec::new();
    
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        let path_str = entry.path().to_string_lossy().to_string();
        
        files.push(FileInfo {
            name,
            path: path_str,
            is_dir: metadata.is_dir(),
            is_file: metadata.is_file(),
        });
    }
    
    // Sort: directories first, then files
    files.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    
    Ok(files)
}

// Detect file encoding
#[tauri::command]
fn detect_encoding(content: Vec<u8>) -> String {
    let mut detector = chardetng::EncodingDetector::new();
    detector.feed(&content, true);
    let encoding = detector.guess(None, true);
    encoding.name().to_string()
}

// Read file with encoding detection
#[tauri::command]
fn read_file_with_encoding(path: String) -> Result<FileContent, String> {
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    
    let mut detector = chardetng::EncodingDetector::new();
    detector.feed(&bytes, true);
    let encoding = detector.guess(None, true);
    
    let (content, _, had_errors) = encoding.decode(&bytes);
    if had_errors {
        // Fallback to UTF-8 lossy
        let content = String::from_utf8_lossy(&bytes).to_string();
        return Ok(FileContent {
            content,
            encoding: "UTF-8 (lossy)".to_string(),
        });
    }
    
    let content_str: String = content.into_owned();
    Ok(FileContent {
        content: content_str,
        encoding: encoding.name().to_string(),
    })
}

// Read file with specific encoding
#[tauri::command]
fn read_file_with_specific_encoding(path: String, encoding_name: String) -> Result<String, String> {
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    
    let encoding = match encoding_name.to_lowercase().as_str() {
        "utf-8" => encoding_rs::UTF_8,
        "gb2312" | "gbk" => encoding_rs::GBK,
        "gb18030" => encoding_rs::GB18030,
        "big5" => encoding_rs::BIG5,
        "shift_jis" => encoding_rs::SHIFT_JIS,
        "euc-jp" => encoding_rs::EUC_JP,
        "iso-8859-1" => encoding_rs::ISO_8859_2,
        "windows-1252" => encoding_rs::WINDOWS_1252,
        _ => encoding_rs::UTF_8,
    };
    
    let (content, _, _) = encoding.decode(&bytes);
    Ok(content.to_string())
}

// Save file with specific encoding
#[tauri::command]
fn save_file_with_encoding(path: String, content: String, encoding_name: String, with_bom: bool) -> Result<(), String> {
    let encoding = match encoding_name.to_lowercase().as_str() {
        "utf-8" => encoding_rs::UTF_8,
        "gb2312" | "gbk" => encoding_rs::GBK,
        "gb18030" => encoding_rs::GB18030,
        "big5" => encoding_rs::BIG5,
        "shift_jis" => encoding_rs::SHIFT_JIS,
        "euc-jp" => encoding_rs::EUC_JP,
        "iso-8859-1" => encoding_rs::ISO_8859_2,
        "windows-1252" => encoding_rs::WINDOWS_1252,
        _ => encoding_rs::UTF_8,
    };
    
    let (encoded, _, _) = encoding.encode(&content);
    
    let mut final_bytes = Vec::new();
    
    // Add BOM if requested for UTF-8
    if with_bom && encoding_name.to_lowercase() == "utf-8" {
        final_bytes.extend_from_slice(&[0xEF, 0xBB, 0xBF]);
    }
    
    final_bytes.extend_from_slice(&encoded);
    
    fs::write(&path, final_bytes).map_err(|e| e.to_string())?;
    Ok(())
}

// Base64 encode
#[tauri::command]
fn base64_encode(text: String) -> String {
    use base64::{Engine as _, engine::general_purpose};
    general_purpose::STANDARD.encode(text)
}

// Base64 decode
#[tauri::command]
fn base64_decode(text: String) -> Result<String, String> {
    use base64::{Engine as _, engine::general_purpose};
    general_purpose::STANDARD.decode(text)
        .map_err(|e| e.to_string())
        .and_then(|bytes| String::from_utf8(bytes).map_err(|e| e.to_string()))
}

// Calculate MD5 hash
#[tauri::command]
fn calculate_md5(text: String) -> String {
    format!("{:x}", md5::compute(text))
}

// Calculate SHA1 hash
#[tauri::command]
fn calculate_sha1(text: String) -> String {
    use sha1::Digest;
    let mut hasher = sha1::Sha1::new();
    hasher.update(text);
    format!("{:x}", hasher.finalize())
}

// Calculate SHA256 hash
#[tauri::command]
fn calculate_sha256(text: String) -> String {
    use sha2::Digest;
    let mut hasher = sha2::Sha256::new();
    hasher.update(text);
    format!("{:x}", hasher.finalize())
}

// Get file metadata
#[tauri::command]
fn get_file_metadata(path: String) -> Result<serde_json::Value, String> {
    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    let path_obj = Path::new(&path);
    
    Ok(serde_json::json!({
        "size": metadata.len(),
        "is_file": metadata.is_file(),
        "is_dir": metadata.is_dir(),
        "modified": metadata.modified().ok().map(|t| t.duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs()),
        "name": path_obj.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default(),
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            read_directory,
            detect_encoding,
            read_file_with_encoding,
            read_file_with_specific_encoding,
            save_file_with_encoding,
            base64_encode,
            base64_decode,
            calculate_md5,
            calculate_sha1,
            calculate_sha256,
            get_file_metadata,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
