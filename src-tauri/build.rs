fn main() {
    // Bake the env variables first
    if let Ok(path) = std::env::var("PYTHON_RUNTIME_PATH") {
        println!("cargo:rustc-env=PYTHON_RUNTIME_PATH={}", path);
    }

    // Then build the app
    tauri_build::build();
}
