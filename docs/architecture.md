## Executive Summary

Silksong Text Editor is a desktop application for browsing and editing in-game text for Hollow Knight: Silksong. It combines a modern React/Next.js frontend (TypeScript) with a secure Tauri v2 desktop shell (Rust) and leverages Python scripts to parse and write Unity `.assets` files. Users can load either the original `resources.assets` file or an exported `.assets.json`, edit entries with a diff preview, and export their changes back to `.assets` or `.assets.json` formats.

## Architecture Overview

### Key responsibilities

- Frontend (`src/`): UI, editing workflow, state management, i18n.
- Desktop backend (`src-tauri/`): IPC commands, filesystem dialogs, bundling Python runtime and scripts, process orchestration.
- Python layer (`src-python/`): Parse and write Unity `TextAsset` data including AES-ECB decryption/encryption and XML-like entry rebuilding.

### Components and boundaries

- UI: Next.js App Router + HeroUI components for upload, edit, diff, save/export.
- IPC: Tauri `invoke` calls from the renderer to Rust commands.
- Python: Invoked as external processes; communicates via stdout/stderr and JSON payloads.
- Data model: DialogueData shape shared between layers; JSON serialization for IPC and persistence.

## Frontend (Next.js + TypeScript)

Key UI components:

- `src/components/file-upload.tsx`: Select `.assets` or `.assets.json`, parse via Tauri invoke, update store.
- `src/components/dialogue-editor/*`: Scene selection, inline text editing, and diff viewer for edited vs original.
- `src/components/export-modal.tsx`: Choose target path and export format; calls Tauri commands to write `.assets` or `.assets.json`.
- `src/components/navbar.tsx`: Language selector, Save (commits edits to original), Export modal trigger.

## Desktop Backend (Tauri v2 + Rust)

Entrypoint and builder:

```1:12:src-tauri/src/main.rs
fn main() { app_lib::run(); }
```

Commands and setup:

```1:13:src-tauri/src/lib.rs
tauri::Builder::default()
  .plugin(tauri_plugin_dialog::init())
  .invoke_handler(tauri::generate_handler![
    parse_assets_file, export_assets_file, parse_assets_json_file, export_assets_json_file
  ])
```

Python runtime resolution and command execution:

```27:42:src-tauri/src/lib.rs
fn get_python_path(app: tauri::AppHandle) -> Result<PathBuf, String> { /* resolve bundled or dev venv */ }
```

Bundled resources (Windows example):

```1:9:src-tauri/tauri.windows.conf.json
{
  "bundle": {
    "resources": {
      "../python-runtime/windows-x64": "python-runtime",
      "../src-python/scripts/read_assets_file.py": "src-python/scripts/read_assets_file.py",
      "../src-python/scripts/write_assets_file.py": "src-python/scripts/write_assets_file.py"
    }
  }
}
```

## Data Models and Contracts

File formats:

- `.assets`: Unity binary file; Python handles decryption/encryption and XML-ish reconstruction.
- `.assets.json`: JSON mirror of DialogueData; round-trippable via Rust helpers.

## Deployment & Operations

### Local development:

- Run Tauri and Next.js dev servers: `bun tauri dev`.
- Ensure Python deps installed if running scripts locally.

### Packaging

Tauri bundles Windows app and includes python-runtime and Python scripts per config.

- Run `bun tauri build`.
- Targets: only `nsis` (Windows) for now.

## Security & Privacy

Principles:

- Minimal permissions via capability file (`core:default`, `dialog:default`).
- Python executed with explicit script paths resolved from app resources.
- All IPC boundaries validate success and propagate stderr on failure.

Considerations and future hardening:

- Expose only necessary Tauri commands; avoid arbitrary exec.
- Validate input file paths and ensure safe destinations for writes.

## Appendix

Glossary:

- DialogueData: nested object organizing scenes and entries with original/edited text.
- TextAsset: Unity serialized asset type used for localized text blobs.
