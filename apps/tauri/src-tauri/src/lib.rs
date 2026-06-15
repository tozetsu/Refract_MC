mod config;
mod download;
mod instances;
mod paths;
mod process;

/// Tauri entry point. Each former Electron IPC handler becomes a `#[tauri::command]`
/// registered here; the renderer calls them via `invoke(...)`.
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            config::config_get,
            config::config_set,
            instances::instances_list,
            download::download_demo,
            process::process_run,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
