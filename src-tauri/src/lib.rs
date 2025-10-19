use std::env;
use std::path::PathBuf;
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            parse_assets_file,
            export_assets_file,
            parse_assets_json_file,
            export_assets_json_file
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Determine python path as per dev vs prod
fn get_python_path(app: tauri::AppHandle) -> Result<PathBuf, String> {
    use tauri::Manager;

    // Use local venv in development
    if cfg!(debug_assertions) {
        let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        path.pop();
        path.push("src-python/.venv");
        if cfg!(target_os = "windows") {
            path.push("Scripts/python.exe");
        } else {
            path.push("bin/python");
        }
        println!("python_path: {}", path.display());
        return Ok(path);
    }

    if let Ok(mut bundled_path) = app
        .path()
        .resolve("python-runtime", tauri::path::BaseDirectory::Resource)
    {
        if cfg!(target_os = "windows") {
            bundled_path.push("python.exe");
        } else {
            bundled_path.push("bin/python");
        }
        // Normalize Windows extended-length paths (\\?\) for compatibility with Command::new()
        return Ok(bundled_path);
    }

    Err("python not found".into())
}

#[tauri::command]
async fn parse_assets_file(
    app: tauri::AppHandle,
    file_path: String,
    language: String,
) -> Result<serde_json::Value, String> {
    use tauri::Manager;
    use tokio::io::{AsyncBufReadExt, BufReader};
    use tokio::process::Command;

    let script_path = match app.path().resolve(
        "src-python/scripts/read_assets_file.py",
        tauri::path::BaseDirectory::Resource,
    ) {
        Ok(p) => p,
        Err(_) => {
            return Err("read_assets_file.py not found".into());
        }
    };

    let python_bin = match get_python_path(app) {
        Ok(p) => p,
        Err(_) => {
            return Err("python not found".into());
        }
    };

    let mut cmd = Command::new(&python_bin);
    cmd.arg(&script_path)
        .arg(&file_path)
        .arg("--language")
        .arg(&language);

    // Enable debug logging in development mode
    if cfg!(debug_assertions) {
        cmd.arg("--debug");
    }

    cmd.stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start Python: {}", e))?;

    // Capture stderr in real-time for logging
    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;
    let stderr_reader = BufReader::new(stderr);
    let mut stderr_lines = stderr_reader.lines();

    // Spawn a task to log stderr lines as they arrive
    tokio::spawn(async move {
        while let Ok(Some(line)) = stderr_lines.next_line().await {
            log::info!("[Python] {}", line);
        }
    });

    // Wait for the process to complete and capture stdout
    let output = child
        .wait_with_output()
        .await
        .map_err(|e| format!("Failed to wait for Python: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "Python script failed with exit code: {}",
            output.status.code().unwrap_or(-1)
        ));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let json: serde_json::Value = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse JSON from Python: {}. Raw: {}", e, stdout))?;
    Ok(json)
}

#[tauri::command]
async fn export_assets_file(
    app: tauri::AppHandle,
    file_path: String,
    dialogue_data: serde_json::Value,
    language: String,
) -> Result<(), String> {
    use tauri::Manager;
    use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
    use tokio::process::Command;

    let script_path = match app.path().resolve(
        "src-python/scripts/write_assets_file.py",
        tauri::path::BaseDirectory::Resource,
    ) {
        Ok(p) => p,
        Err(_) => {
            return Err("write_assets_file.py not found".into());
        }
    };

    let python_bin = get_python_path(app).map_err(|e| e)?;

    let mut cmd = Command::new(python_bin);
    cmd.arg(&script_path)
        .arg(&file_path)
        .arg("--language")
        .arg(&language);

    // Enable debug logging in development mode
    if cfg!(debug_assertions) {
        cmd.arg("--debug");
    }

    cmd.stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start Python: {}", e))?;

    // Write to stdin
    if let Some(mut stdin) = child.stdin.take() {
        let payload = dialogue_data.to_string();
        stdin
            .write_all(payload.as_bytes())
            .await
            .map_err(|e| format!("Failed to write JSON to Python stdin: {}", e))?;
        // Explicitly drop stdin to close the pipe
        drop(stdin);
    } else {
        return Err("Failed to open stdin for Python process".into());
    }

    // Capture stderr in real-time for logging
    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;
    let stderr_reader = BufReader::new(stderr);
    let mut stderr_lines = stderr_reader.lines();

    // Spawn a task to log stderr lines as they arrive
    tokio::spawn(async move {
        while let Ok(Some(line)) = stderr_lines.next_line().await {
            log::info!("[Python] {}", line);
        }
    });

    // Wait for the process to complete
    let output = child
        .wait_with_output()
        .await
        .map_err(|e| format!("Failed to wait for Python: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "Python script failed with exit code: {}",
            output.status.code().unwrap_or(-1)
        ));
    }

    // Parse stdout for result confirmation
    let stdout = String::from_utf8_lossy(&output.stdout);
    if !stdout.is_empty() {
        log::info!("[Python] Result: {}", stdout.trim());
    }

    Ok(())
}

/// Parse a .assets.json file and return DialogueData-compatible JSON structure
#[tauri::command]
async fn parse_assets_json_file(file_path: String) -> Result<serde_json::Value, String> {
    use std::fs;

    let content =
        fs::read_to_string(&file_path).map_err(|e| format!("Failed to read JSON file: {}", e))?;

    let json: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| format!("Invalid JSON: {}", e))?;

    Ok(json)
}

/// Save DialogueData to a chosen .assets.json file path
#[tauri::command]
async fn export_assets_json_file(
    file_path: String,
    dialogue_data: serde_json::Value,
) -> Result<(), String> {
    use std::fs;

    let data_str = serde_json::to_string_pretty(&dialogue_data)
        .map_err(|e| format!("Failed to serialize dialogue data: {}", e))?;

    fs::write(&file_path, data_str).map_err(|e| format!("Failed to write JSON file: {}", e))?;

    Ok(())
}
