use std::path::PathBuf;
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            parse_assets_file,
            export_assets_file
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
fn get_python_path() -> PathBuf {
    if cfg!(debug_assertions) {
        // dev: project .venv or fallback to system python
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        let mut p = PathBuf::from(manifest_dir);
        p.pop(); // go up to project root if necessary
        p.push("src-python");
        p.push(".venv");
        if cfg!(target_os = "windows") {
            p.push("Scripts");
            p.push("python.exe");
        } else {
            p.push("bin");
            p.push("python");
        }
        if p.exists() {
            return p;
        }
        // fallback to system python
        if cfg!(target_os = "windows") {
            PathBuf::from("python.exe")
        } else {
            PathBuf::from("python3")
        }
    } else {
        // prod: packaged runtime under resources/python
        // let mut r = resource_dir().expect("resource dir not found");
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        let mut r: PathBuf = PathBuf::from(manifest_dir);

        r.push("python");
        if cfg!(target_os = "windows") {
            r.push("python.exe");
        } else {
            r.push("bin");
            r.push("python");
        }
        r
    }
}

#[tauri::command]
async fn parse_assets_file(
    app: tauri::AppHandle,
    file_path: String,
) -> Result<serde_json::Value, String> {
    use std::process::Command;
    use tauri::Manager;

    let script_path = match app.path().resolve(
        "../src-python/scripts/read_assets_file.py",
        tauri::path::BaseDirectory::Resource,
    ) {
        Ok(p) => p,
        Err(_) => {
            return Err("read_assets_file.py not found".into());
        }
    };

    let python_bin = get_python_path();
    let output = match Command::new(python_bin)
        .arg(&script_path)
        .arg(&file_path)
        .output()
    {
        Ok(o) => o,
        Err(e) => return Err(format!("Failed to start Python: {}", e)),
    };

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(format!("Python script error: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let json: serde_json::Value = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse JSON from Python: {}. Raw: {}", e, stdout))?;
    Ok(json)
}

#[tauri::command]
async fn export_assets_file(
    app: tauri::AppHandle,
    file_path: String,
    dialogue_data: serde_json::Value,
) -> Result<(), String> {
    use std::io::Write;
    use std::process::{Command, Stdio};
    use tauri::Manager;

    let script_path = match app.path().resolve(
        "../src-python/scripts/write_assets_file.py",
        tauri::path::BaseDirectory::Resource,
    ) {
        Ok(p) => p,
        Err(_) => {
            return Err("write_assets_file.py not found".into());
        }
    };

    let python_bin = get_python_path();
    let mut child = match Command::new(python_bin)
        .arg(&script_path)
        .arg(&file_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(c) => c,
        Err(e) => return Err(format!("Failed to start Python: {}", e)),
    };

    if let Some(stdin) = child.stdin.as_mut() {
        let payload = dialogue_data.to_string();
        if let Err(e) = stdin.write_all(payload.as_bytes()) {
            return Err(format!("Failed to write JSON to Python stdin: {}", e));
        }
    } else {
        return Err("Failed to open stdin for Python process".into());
    }

    let output = match child.wait_with_output() {
        Ok(o) => o,
        Err(e) => return Err(format!("Failed to wait for Python: {}", e)),
    };

    if !output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        return Err(format!("Python script error: {}", stdout));
    }

    // Optionally parse stdout to confirm, but we don't need to return data
    Ok(())
}
