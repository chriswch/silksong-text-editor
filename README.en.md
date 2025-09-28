# Silksong Text Editor

Simple desktop tool to browse and edit the in‑game text for Hollow Knight: Silksong by modifying the `resources.assets` file.
Designed for players who just want to change text safely.

> Important: At the moment, editing is focused on Traditional Chinese (zh‑TW) entries.

---

## 🙏 Acknowledgments

Special thanks to the following repositories that made this project possible:

[SKSG_TChinese](https://github.com/tents89/SKSG_TChinese)

[SilksongDecryptor](https://github.com/rm-NoobInCoding/SilksongDecryptor)

---

## ✨ Features

- Load and parse the game’s resources.assets file.

- Browse all available in-game text.

- Edit text directly in the app.

- Save and export modifications back into the game file.

> Important: Always back up your original file before overwriting

---

## 🛠️ Contributing

### How it works

- Next.js 15 (SSG) + Tailwind CSS + HeroUI
- Tauri 2 (Rust) desktop shell
- Python (Unity assets parsing / exporting)

The UI calls Tauri commands (Rust), which dispatch to Python for heavy lifting, then return results to the UI.

### Project structure

- `src/` – Next.js app (UI components, hooks, i18n)
- `src-tauri/` – Tauri config and Rust bridge
- `src-python/` – Python scripts for reading/writing Unity assets
- `python-runtime/` – Bundled Python runtime (Windows)

### Setup

1. Install prerequisites

   ```bash
   # Node via nvm (project uses Node v24.7.0)
   nvm use

   # Bun for JS package management
   npm i -g bun

   # Rust toolchain for Tauri
   # (Install from https://rustup.rs and ensure cargo is on PATH)

   # Python (recommended 3.12+) if you plan to work on the Python layer
   # We use uv for Python package management
   # (The app bundles a Python runtime for Windows; devs can still use a local Python.)
   ```

2. Install dependencies

   ```bash
   bun i
   ```

3. Run the desktop app (dev)

   ```bash
   bunx tauri dev
   ```

### Building a release

Produce a desktop build for your platform:

```bash
bunx tauri build
```

The generated bundle will appear under `src-tauri/target/`.
